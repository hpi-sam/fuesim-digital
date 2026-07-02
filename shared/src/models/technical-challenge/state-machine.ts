import { z } from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import type { ExerciseState } from '../../state.js';
import {
    taskTimeSpentSchema,
    type TaskType,
    taskTypeSchema,
} from '../task-type.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../utils/image-properties.js';
import {
    newUserGeneratedContent,
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../user-generated-content.js';
import { type Personnel, personnelSchema } from '../personnel.js';
import { TypeAssertedObject } from '../../utils/type-asserted-object.js';
import {
    logTechnicalChallengePersonnelUnassigned,
    logTechnicalChallengeStateTransition,
} from '../../store/action-reducers/utils/log.js';
import {
    insert,
    modify,
    peek,
    pop,
    remove,
} from '../../state-helpers/events.js';
import type { StateMachineEvent } from './event.js';
import { newStateMachineEvent } from './event.js';
import type { StateMachineId, TechnicalChallengeId } from './ids.js';
import { stateMachineIdSchema } from './ids.js';
import type { Guard, GuardId, TaskGuard, Timer, TimerGuard } from './guard.js';
import { guardSchema, taskSchema, timerSchema } from './guard.js';
import type { GuardIndex } from './guard-index.js';
import { getGuardIndex, invalidateGuardIndex } from './guard-index.js';

const stateMachineStateIdSchema = uuidSchema.brand<'StateMachineStateId'>();

export const transitionSchema = z.strictObject({
    id: uuidSchema,
    targetState: stateMachineStateIdSchema,
    guard: guardSchema,
});
export type Transition = Immutable<z.infer<typeof transitionSchema>>;

export const stateMachineStateSchema = z.object({
    id: stateMachineStateIdSchema,
    title: z.string(),
    image: imagePropertiesSchema,
    userGeneratedContent: userGeneratedContentSchema,
    viewedByParticipants: z.boolean().optional(),
    /**
     * maps taskId to the task-specific progress multiplier (default 1)
     * */
    possibleTasks: z.record(taskTypeSchema.shape.id, z.number()),
    outgoingTransitions: z.record(transitionSchema.shape.id, transitionSchema),

    viewedByParticipant: z.boolean().optional().default(false),
});
export type StateMachineState = Immutable<
    z.infer<typeof stateMachineStateSchema>
>;

export function newTechnicalChallengeState(
    title: string,
    image: ImageProperties,
    outgoingTransitions: { [key: UUID]: Transition },
    possibleTasks: UUID[] | { [key: UUID]: number } = {},
    userGeneratedContent?: UserGeneratedContent
): StateMachineState {
    if (possibleTasks instanceof Array) {
        // eslint-disable-next-line no-param-reassign
        possibleTasks = Object.fromEntries(possibleTasks.map((id) => [id, 1]));
    }

    return {
        id: uuid() as StateMachineState['id'],
        title,
        image,
        userGeneratedContent: userGeneratedContent ?? newUserGeneratedContent(),
        possibleTasks,
        outgoingTransitions,
        viewedByParticipant: false,
    };
}

/**
 * Not currently called anywhere. If this becomes used to edit a live
 * state machine's guard tree, the caller must also call
 * {@link invalidateGuardIndex} for that state machine's id, since this
 * changes the guard tree topology.
 */
export function addTransitionTo(
    state: StateMachineState,
    newTransition: Transition,
    priority?: number
): StateMachineState {
    const newTransitions = { ...state.outgoingTransitions };
    newTransitions[newTransition.id] = newTransition;

    return {
        ...state,
        outgoingTransitions: newTransitions,
    };
}

export function getTaskProgress(
    taskId: TaskType['id'],
    stateMachine: StateMachine,
    currentTime: ExerciseState['currentTime']
): TaskProgress {
    console.assert(
        stateMachine.tasks[taskId],
        `Task ${taskId} does not exist on stateMachine.`,
        stateMachine
    );
    const taskTimeSpent = stateMachine.taskTimeSpent[taskId];
    const state = currentStateOf(stateMachine);
    const nAssignedPersonnel = Object.values(
        stateMachine.assignedPersonnel
    ).filter((_taskId) => _taskId === taskId).length;
    const rate = nAssignedPersonnel * (state.possibleTasks[taskId] ?? 0);

    const timeSpent =
        (taskTimeSpent?.timeSpent ?? 0) +
        (taskTimeSpent
            ? (currentTime - taskTimeSpent.lastUpdatedAt) * rate
            : 0);
    const totalTaskDuration = stateMachine.tasks[taskId]!.totalDuration;
    const progressPercentage = timeSpent / totalTaskDuration;
    console.log(
        `[getTaskProgress] taskId=${taskId} t=${currentTime} nAssigned=${nAssignedPersonnel} rate=${rate} timeSpent=${timeSpent} progress=${(progressPercentage * 100).toFixed(2)}%`
    );
    return { timeSpent, progressPercentage, rate };
}

export function getTimerProgress(
    timerId: Timer['id'],
    stateMachine: StateMachine,
    currentTime: ExerciseState['currentTime']
): TimerProgress {
    const relativeTime = currentTime - stateMachine.simulationStartTime;

    const timer = stateMachine.timers[timerId]!;

    const progressPercentage = relativeTime / timer.totalDuration;

    return { relativeTime, progressPercentage };
}

export function getGuardProgress(
    guard: Guard,
    stateMachine: StateMachine,
    currentTime: ExerciseState['currentTime']
): GuardProgress {
    switch (guard.type) {
        case 'taskGuard':
            return getTaskProgress(guard.taskId, stateMachine, currentTime);
        case 'timerGuard':
            return getTimerProgress(guard.timerId, stateMachine, currentTime);
        case 'andGuard': {
            const res = guard.guards.reduce(
                (v, g) =>
                    v +
                    getGuardProgress(g, stateMachine, currentTime)
                        .progressPercentage,
                0
            );
            return { progressPercentage: res / guard.guards.length };
        }
        case 'notGuard':
            return {
                progressPercentage: isGuardFulfilled(
                    guard,
                    stateMachine,
                    currentTime
                )
                    ? 1
                    : 0,
            };
    }
}

export interface GuardProgress {
    progressPercentage: number;
}

export interface TaskProgress extends GuardProgress {
    timeSpent: number;
    rate: number;
}

export interface TimerProgress extends GuardProgress {
    relativeTime: number;
}

function isTaskGuardFulfilled(
    taskGuard: TaskGuard,
    stateMachine: StateMachine,
    currentTime: number
): boolean {
    const { progressPercentage } = getTaskProgress(
        taskGuard.taskId,
        stateMachine,
        currentTime
    );
    return progressPercentage >= taskGuard.minProgress;
}

function isTimerGuardFulfilled(
    timerGuard: TimerGuard,
    stateMachine: StateMachine,
    currentTime: number
): boolean {
    const { progressPercentage } = getTimerProgress(
        timerGuard.timerId,
        stateMachine,
        currentTime
    );

    return progressPercentage >= timerGuard.minProgress;
}

export const stateMachineDefinitionSchema = z.strictObject({
    id: stateMachineIdSchema,
    name: z.string(),
    states: z.record(stateMachineStateSchema.shape.id, stateMachineStateSchema),
    initialStateId: stateMachineStateSchema.shape.id,
    tasks: z.record(taskTypeSchema.shape.id, taskSchema),
    timers: z.record(timerSchema.shape.id, timerSchema),
});

export const stateMachineSchema = z
    .strictObject({
        ...stateMachineDefinitionSchema.shape,
        // runtime values:
        simulationStartTime: z.number().default(0),
        currentStateId: stateMachineStateSchema.shape.id,
        taskTimeSpent: z.record(taskTypeSchema.shape.id, taskTimeSpentSchema),
        assignedPersonnel: z.record(
            personnelSchema.shape.id,
            taskTypeSchema.shape.id
        ),
    })
    .superRefine((val, ctx) => {
        if (!(val.initialStateId in val.states)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Kein gültiger Startzustand festgelegt.',
                input: val,
            });
        }
    });
export type StateMachine = Immutable<z.infer<typeof stateMachineSchema>>;

export function currentStateOf(
    stateMachine: WritableDraft<StateMachine>
): WritableDraft<StateMachineState>;
export function currentStateOf(stateMachine: StateMachine): StateMachineState;
export function currentStateOf(
    stateMachine: StateMachine | WritableDraft<StateMachine>
): StateMachineState | WritableDraft<StateMachineState> {
    const state = stateMachine.states[stateMachine.currentStateId];
    console.assert(
        !!state,
        `Invalid current state: ${stateMachine.currentStateId} for challenge ${stateMachine.id}`
    );
    return state!;
}

function currentlyPossibleTaskIds(
    stateMachine: StateMachine
): TaskType['id'][] {
    const currentState = currentStateOf(stateMachine);

    return TypeAssertedObject.keys(currentState.possibleTasks);
}

function unassignFromNonexistentTasks(
    stateMachine: WritableDraft<StateMachine>
): { personnelId: Personnel['id']; taskTypeId: TaskType['id'] }[] {
    const unassignedPersonnel: {
        taskTypeId: TaskType['id'];
        personnelId: Personnel['id'];
    }[] = [];
    for (const [personnelId, taskTypeId] of Object.entries(
        stateMachine.assignedPersonnel
    )) {
        if (!currentlyPossibleTaskIds(stateMachine).includes(taskTypeId)) {
            delete stateMachine.assignedPersonnel[personnelId];
            unassignedPersonnel.push({ taskTypeId, personnelId });
        }
    }
    return unassignedPersonnel;
}

function isGuardFulfilled(
    guard: Guard,
    stateMachine: StateMachine,
    currentTime: number
): boolean {
    switch (guard.type) {
        case 'taskGuard':
            return isTaskGuardFulfilled(guard, stateMachine, currentTime);
        case 'timerGuard':
            return isTimerGuardFulfilled(guard, stateMachine, currentTime);
        case 'andGuard':
            return guard.guards.every((g) =>
                isGuardFulfilled(g, stateMachine, currentTime)
            );
        case 'notGuard':
            return !isGuardFulfilled(guard.guard, stateMachine, currentTime);
    }
}

export function updateTaskProgress(
    stateMachine: WritableDraft<StateMachine>,
    currentTime: ExerciseState['currentTime'],
    taskId: TaskType['id'],
    state: StateMachineState | null = null
) {
    // eslint-disable-next-line no-param-reassign
    state ??= currentStateOf(stateMachine);

    if (!state.possibleTasks[taskId]) return;

    const taskProgress = stateMachine.taskTimeSpent[taskId];

    if (!taskProgress) {
        console.log(
            `[updateTaskProgress] taskId=${taskId} t=${currentTime} INIT (first seen)`
        );
        stateMachine.taskTimeSpent[taskId] = {
            timeSpent: 0,
            lastUpdatedAt: currentTime,
        };
        return;
    }

    const nAssignedPersonnel = Object.values(
        stateMachine.assignedPersonnel
    ).filter((_taskId) => _taskId === taskId).length;

    const rate = nAssignedPersonnel * state.possibleTasks[taskId];
    const delta = (currentTime - taskProgress.lastUpdatedAt) * rate;
    const oldTimeSpent = taskProgress.timeSpent;
    taskProgress.timeSpent = oldTimeSpent + delta;
    taskProgress.lastUpdatedAt = currentTime;
    console.log(
        `[updateTaskProgress] taskId=${taskId} t=${currentTime} nAssigned=${nAssignedPersonnel} rate=${rate} delta=${delta.toFixed(3)} timeSpent: ${oldTimeSpent.toFixed(3)}→${taskProgress.timeSpent.toFixed(3)}`
    );
}

export function updateAllTasksProgress(
    exerciseState: WritableDraft<ExerciseState>,
    stateMachine: WritableDraft<StateMachine>
) {
    const state = currentStateOf(stateMachine);

    for (const taskId of TypeAssertedObject.keys(state.possibleTasks))
        updateTaskProgress(stateMachine, exerciseState.currentTime, taskId);
}

function computeEarliestEvent(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    transitions: WritableDraft<Transition>[]
): StateMachineEvent | null {
    const index = getGuardIndex(stateMachine);
    let earliestTimestamp = Infinity;
    let earliestEvent: StateMachineEvent | null = null;

    for (const transition of transitions) {
        const guard = transition.guard;
        const eventTimestamp = getGuardTimestamp(
            stateMachine,
            exerciseState,
            index,
            guard
        );

        console.log(
            `[computeEarliestEvent] transitionId=${transition.id} current=${eventTimestamp.current} nextChange=${eventTimestamp.nextChange}`
        );

        if (eventTimestamp.nextChange >= earliestTimestamp) continue;
        earliestTimestamp = eventTimestamp.nextChange;
        earliestEvent = newStateMachineEvent(
            eventTimestamp.nextChange,
            technicalChallengeId,
            stateMachine.id,
            transition.id
        );
    }

    console.log(
        `[computeEarliestEvent] → earliest: transitionId=${earliestEvent?.transitionId ?? 'none'} t=${earliestEvent?.timestamp ?? 'null'}`
    );
    return earliestEvent;
}

/**
 * Walks bottom-up from a leaf guard (identified by id) to the root of its
 * transition's guard tree, recomputing/propagating cached `nextChange`
 * values along the way. Uses `index.nextChangeOf`/`index.parentOf` instead
 * of fields on the `Guard` object itself (see `guard-index.ts`).
 */
function propagateTaskChange(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    index: GuardIndex,
    transitionId: Transition['id'],
    guardId: GuardId | undefined,
    oldTimestamp?: number,
    newTimestamp?: number
): StateMachineEvent | null {
    if (guardId === undefined) {
        if (oldTimestamp === newTimestamp) return null;
        return newStateMachineEvent(
            newTimestamp!,
            technicalChallengeId,
            stateMachine.id,
            transitionId
        );
    }
    const guard = index.guardById.get(guardId)!;
    const parentId = index.parentOf.get(guardId) ?? undefined;
    switch (guard.type) {
        case 'taskGuard': {
            const taskProgress = getTaskProgress(
                guard.taskId,
                stateMachine,
                exerciseState.currentTime
            );

            const totalDuration =
                stateMachine.tasks[guard.taskId]!.totalDuration;
            const remainingDuration =
                guard.minProgress * totalDuration - taskProgress.timeSpent;
            const nextChange =
                exerciseState.currentTime +
                remainingDuration / taskProgress.rate;

            const thisOldTimestamp = index.nextChangeOf.get(guardId)!;
            index.nextChangeOf.set(guardId, nextChange);

            console.log(
                `[propagate:task] taskId=${guard.taskId} transitionId=${transitionId} nextChange: ${thisOldTimestamp}→${nextChange} parentId=${parentId ?? 'null(root)'}`
            );

            return propagateTaskChange(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                index,
                transitionId,
                parentId,
                thisOldTimestamp,
                nextChange
            );
        }
        case 'notGuard': {
            console.log(
                `[propagate:not] transitionId=${transitionId} passthrough old=${oldTimestamp} new=${newTimestamp} parentId=${parentId ?? 'null(root)'}`
            );
            return propagateTaskChange(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                index,
                transitionId,
                parentId,
                oldTimestamp,
                newTimestamp
            );
        }
        case 'andGuard': {
            const currentNextChange = index.nextChangeOf.get(guardId)!;
            if (currentNextChange !== oldTimestamp) {
                // This guard did not define this trees next event
                if (newTimestamp! <= currentNextChange) {
                    console.log(
                        `[propagate:and] transitionId=${transitionId} NOT the defining child (nextChange=${currentNextChange} !== old=${oldTimestamp}), new=${newTimestamp} ≤ nextChange → STOP`
                    );
                    return null;
                }
                // The new timestamp is after the nextChange timestamp, so this is the new nextChange timestamp
                index.nextChangeOf.set(guardId, newTimestamp!);
                console.log(
                    `[propagate:and] transitionId=${transitionId} NOT the defining child but new=${newTimestamp} > nextChange=${currentNextChange} → nextChange: ${currentNextChange}→${newTimestamp} parentId=${parentId ?? 'null(root)'}`
                );
                return propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    index,
                    transitionId,
                    parentId,
                    currentNextChange,
                    newTimestamp
                );
            }

            // This guard might have defined this trees next event
            const subGuards = guard.childIds.map(
                (id) => index.nextChangeOf.get(id)!
            );

            const nextChange = Math.max(...subGuards);
            if (nextChange !== currentNextChange) {
                index.nextChangeOf.set(guardId, nextChange);
                console.log(
                    `[propagate:and] transitionId=${transitionId} WAS the defining child, subGuards=[${subGuards.join(',')}] nextChange: ${currentNextChange}→${nextChange} parentId=${parentId ?? 'null(root)'}`
                );
                return propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    index,
                    transitionId,
                    parentId,
                    currentNextChange,
                    nextChange
                );
            }
            console.log(
                `[propagate:and] transitionId=${transitionId} WAS the defining child, subGuards=[${subGuards.join(',')}] nextChange unchanged=${currentNextChange} → STOP`
            );
            return null;
        }
        case 'timerGuard':
            throw new Error('This should be unreachable.');
    }
}

function getGuardTimestamp(
    stateMachine: WritableDraft<StateMachine>,
    exerciseState: WritableDraft<ExerciseState>,
    index: GuardIndex,
    guard: WritableDraft<Guard>
): {
    current: boolean;
    nextChange: number;
} {
    switch (guard.type) {
        case 'notGuard': {
            const subGuard = getGuardTimestamp(
                stateMachine,
                exerciseState,
                index,
                guard.guard
            );
            const cached = index.nextChangeOf.has(guard.id);
            if (!cached) index.nextChangeOf.set(guard.id, subGuard.nextChange);
            console.log(
                `[guardTs:not] child.current=${subGuard.current} child.nextChange=${subGuard.nextChange} → current=${!subGuard.current}${cached ? ' [cached]' : ''}`
            );
            return {
                current: !subGuard.current,
                nextChange: subGuard.nextChange,
            };
        }
        case 'andGuard': {
            const subGuards = guard.guards.map((g) =>
                getGuardTimestamp(stateMachine, exerciseState, index, g)
            );
            const current = subGuards.reduce((v, g) => v && g.current, true);
            const nextChange = current
                ? Math.min(...subGuards.map((g) => g.nextChange))
                : Math.max(
                      ...subGuards
                          .filter((g) => !g.current)
                          .map((g) => g.nextChange)
                  );

            const cached = index.nextChangeOf.has(guard.id);
            if (!cached) index.nextChangeOf.set(guard.id, nextChange);
            console.log(
                `[guardTs:and] children=[${subGuards.map((g) => `{cur:${g.current},nc:${g.nextChange}}`).join(',')}] allFulfilled=${current} nextChange=${nextChange}${cached ? ' [cached]' : ''}`
            );
            return {
                current,
                nextChange,
            };
        }
        case 'taskGuard': {
            const taskProgress = getTaskProgress(
                guard.taskId,
                stateMachine,
                exerciseState.currentTime
            );

            if (
                isTaskGuardFulfilled(
                    guard,
                    stateMachine,
                    exerciseState.currentTime
                )
            ) {
                console.log(
                    `[guardTs:task] taskId=${guard.taskId} progress=${(taskProgress.progressPercentage * 100).toFixed(2)}% FULFILLED → nextChange=Infinity`
                );
                return { current: true, nextChange: Infinity };
            }

            const totalDuration =
                stateMachine.tasks[guard.taskId]!.totalDuration;
            const remainingDuration =
                guard.minProgress * totalDuration - taskProgress.timeSpent;
            const nextChange =
                exerciseState.currentTime +
                remainingDuration / taskProgress.rate;

            const cached = index.nextChangeOf.has(guard.id);
            if (!cached) index.nextChangeOf.set(guard.id, nextChange);

            console.log(
                `[guardTs:task] taskId=${guard.taskId} progress=${(taskProgress.progressPercentage * 100).toFixed(2)}% rate=${taskProgress.rate} remaining=${remainingDuration.toFixed(3)} nextChange=${nextChange}${cached ? ' [cached]' : ''}`
            );
            return {
                current: false,
                nextChange,
            };
        }
        case 'timerGuard': {
            if (
                isTimerGuardFulfilled(
                    guard,
                    stateMachine,
                    exerciseState.currentTime
                )
            ) {
                console.log(
                    `[guardTs:timer] timerId=${guard.timerId} FULFILLED → nextChange=Infinity`
                );
                return { current: true, nextChange: Infinity };
            }

            const timer = stateMachine.timers[guard.timerId]!;
            const nextChange =
                stateMachine.simulationStartTime +
                guard.minProgress * timer.totalDuration;

            const cached = index.nextChangeOf.has(guard.id);
            if (!cached) index.nextChangeOf.set(guard.id, nextChange);

            console.log(
                `[guardTs:timer] timerId=${guard.timerId} simulationStartTime=${stateMachine.simulationStartTime} minProgress=${guard.minProgress} totalDuration=${timer.totalDuration} nextChange=${nextChange}${cached ? ' [cached]' : ''}`
            );
            return {
                current: false,
                nextChange,
            };
        }
    }
}

function applyEventToQueue(
    exerciseState: WritableDraft<ExerciseState>,
    stateMachineId: StateMachineId,
    earliestEvent: StateMachineEvent | null
): void {
    const queue = exerciseState.stateMachineEventQueue;

    if (earliestEvent === null) {
        console.log(
            `[applyEvent:remove] smId=${stateMachineId} no event to schedule`
        );
        remove(queue, stateMachineId);
        return;
    }
    if (queue.indices[stateMachineId] === undefined) {
        console.log(
            `[applyEvent:insert] smId=${stateMachineId} transitionId=${earliestEvent.transitionId} t=${earliestEvent.timestamp}`
        );
        insert(queue, earliestEvent);
        return;
    }
    const current = queue.events[queue.indices[stateMachineId]]!;
    if (
        current.transitionId === earliestEvent.transitionId &&
        current.timestamp === earliestEvent.timestamp
    ) {
        console.log(
            `[applyEvent:noOp] smId=${stateMachineId} transitionId=${earliestEvent.transitionId} t=${earliestEvent.timestamp} unchanged`
        );
        return;
    }
    console.log(
        `[applyEvent:update] smId=${stateMachineId} transitionId: ${current.transitionId}→${earliestEvent.transitionId} t: ${current.timestamp}→${earliestEvent.timestamp}`
    );
    modify(queue, stateMachineId, earliestEvent);
}

/** Full recomputation across all transitions — use after state transitions and on initial creation. */
export function updateEventQueue(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>
) {
    const state = currentStateOf(stateMachine);

    const potentialTransitions = Object.values(state.outgoingTransitions);

    console.log(
        `[updateQueue:full] smId=${stateMachine.id} currentStateId=${state.id} nTransitions=${potentialTransitions.length} t=${exerciseState.currentTime}`
    );

    if (potentialTransitions.length === 0) {
        console.log(
            `[updateQueue:full] smId=${stateMachine.id} no outgoing transitions → removing from queue`
        );
        remove(exerciseState.stateMachineEventQueue, stateMachine.id);
    }

    const earliestEvent = computeEarliestEvent(
        exerciseState,
        technicalChallengeId,
        stateMachine,
        potentialTransitions
    );

    console.log(
        `[updateQueue:done] smId=${stateMachine.id} → event t=${earliestEvent?.timestamp ?? 'null'} transitionId=${earliestEvent?.transitionId ?? 'null'}`
    );
    applyEventToQueue(exerciseState, stateMachine.id, earliestEvent);
}

/**
 * Targeted update after a personnel assignment changes.
 */
export function updateEventQueueAfterTaskChange(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    taskId: TaskType['id']
): void {
    const state = currentStateOf(stateMachine);
    const index = getGuardIndex(stateMachine);
    const affectedTransitions =
        index.taskGuardsByTransition.get(taskId) ??
        new Map<Transition['id'], readonly GuardId[]>();

    const nAffectedTransitions = [...affectedTransitions.keys()].filter(
        (transitionId) => transitionId in state.outgoingTransitions
    ).length;
    console.log(
        `[updateQueueTask] taskId=${taskId} smId=${stateMachine.id} stateId=${state.id} nAffectedTransitions=${nAffectedTransitions} t=${exerciseState.currentTime}`
    );

    let newEvent: StateMachineEvent | undefined;
    for (const [transitionId, guardIds] of affectedTransitions) {
        // Only transitions outgoing from the *current* state are relevant.
        if (!(transitionId in state.outgoingTransitions)) continue;

        console.log(
            `[updateQueueTask:transition] transitionId=${transitionId} nGuardLeaves=${guardIds.length}`
        );
        const events = guardIds
            .map((guardId) =>
                propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    index,
                    transitionId,
                    guardId
                )
            )
            .filter((e) => e !== null);
        console.log(
            `[updateQueueTask:transition] transitionId=${transitionId} propagation produced ${events.length} event(s): [${events.map((e) => e.timestamp).join(',')}]`
        );
        for (const event of events) {
            if (event.timestamp < (newEvent?.timestamp ?? Infinity)) {
                newEvent = event;
            }
        }
    }

    if (newEvent === undefined) {
        console.log(`[updateQueueTask] taskId=${taskId} → no event change`);
        return;
    }

    const queue = exerciseState.stateMachineEventQueue;
    if (queue.indices[stateMachine.id] === undefined) {
        console.log(
            `[updateQueueTask:insert] smId=${stateMachine.id} transitionId=${newEvent.transitionId} t=${newEvent.timestamp}`
        );
        insert(queue, newEvent);
        return;
    }
    const current = queue.events[queue.indices[stateMachine.id]!]!;
    if (newEvent.timestamp < current.timestamp) {
        console.log(
            `[updateQueueTask:update] smId=${stateMachine.id} transitionId: ${current.transitionId}→${newEvent.transitionId} t: ${current.timestamp}→${newEvent.timestamp}`
        );
        modify(queue, stateMachine.id, newEvent);
    } else {
        console.log(
            `[updateQueueTask:noOp] smId=${stateMachine.id} new t=${newEvent.timestamp} ≥ current t=${current.timestamp} → unchanged`
        );
    }
}

function simulateStateMachine(
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    transitionId: WritableDraft<UUID>,
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number,
    logStateTransition?: (targetStateId: StateMachineState['id']) => void,
    logPersonnelUnassigned?: (
        personnelId: Personnel['id'],
        taskTypeId: TaskType['id']
    ) => void
): void {
    const state = currentStateOf(stateMachine);

    const nextTransition = state.outgoingTransitions[transitionId];

    if (!nextTransition) return;

    console.log(
        `[simulate] smId=${stateMachine.id} transitionId=${transitionId} state: ${stateMachine.currentStateId}→${nextTransition.targetState} t=${exerciseState.currentTime}`
    );
    for (const [taskId, taskTimeSpent] of Object.entries(
        stateMachine.taskTimeSpent
    )) {
        console.log(
            `[simulate:taskProgress] taskId=${taskId} timeSpent=${taskTimeSpent.timeSpent.toFixed(3)} lastUpdatedAt=${taskTimeSpent.lastUpdatedAt}`
        );
    }

    logStateTransition?.(nextTransition.targetState);

    updateAllTasksProgress(exerciseState, stateMachine);

    stateMachine.currentStateId = nextTransition.targetState;

    const unassignedPersonnel = unassignFromNonexistentTasks(stateMachine);

    if (unassignedPersonnel.length > 0) {
        console.log(
            `[simulate:unassign] smId=${stateMachine.id} unassigned ${unassignedPersonnel.map((p) => `${p.personnelId}(task:${p.taskTypeId})`).join(', ')}`
        );
        if (logPersonnelUnassigned) {
            for (const { personnelId, taskTypeId } of unassignedPersonnel) {
                logPersonnelUnassigned(personnelId, taskTypeId);
            }
        }
    }

    updateEventQueue(exerciseState, technicalChallengeId, stateMachine);
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const queue = draftState.stateMachineEventQueue;
    const nextEvent = peek(queue);
    console.log(
        `[tick] currentTime=${draftState.currentTime} nextEventTime=${nextEvent?.timestamp ?? 'none'} smId=${nextEvent?.stateMachineId ?? '-'} transitionId=${nextEvent?.transitionId ?? '-'}`
    );

    let nProcessed = 0;
    while ((peek(queue)?.timestamp ?? Infinity) <= draftState.currentTime) {
        const event = pop(queue)!;
        console.log(
            `[tick:fire] #${nProcessed} smId=${event.stateMachineId} transitionId=${event.transitionId} eventTime=${event.timestamp} currentTime=${draftState.currentTime}`
        );
        nProcessed++;
        const stateMachine =
            draftState.technicalChallenges[event.technicalChallengeId]!
                .stateMachines[event.stateMachineId]!;
        simulateStateMachine(
            event.technicalChallengeId,
            stateMachine,
            event.transitionId,
            draftState,
            tickInterval,
            (targetStateId) =>
                logTechnicalChallengeStateTransition(
                    draftState,
                    event.technicalChallengeId,
                    stateMachine.currentStateId,
                    targetStateId
                ),
            (personnelId, taskTypeId) =>
                logTechnicalChallengePersonnelUnassigned(
                    draftState,
                    event.technicalChallengeId,
                    personnelId,
                    taskTypeId
                )
        );
    }
    console.log(`[tick:done] processed ${nProcessed} event(s) this tick`);
}
