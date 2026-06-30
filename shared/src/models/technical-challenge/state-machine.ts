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

const taskSchema = z.object({
    /**
     * As there are never more than a single task of a type per state machine,
     * `taskTypeId` is also the primary key for tasks.
     */
    taskTypeId: taskTypeSchema.shape.id,
    totalDuration: z.number().nonnegative(),
});

const timerSchema = z.object({
    id: uuidSchema.brand<'TimerId'>(),
    name: z.string(),
    totalDuration: z.number().nonnegative(),
});
type Timer = z.infer<typeof timerSchema>;

const baseGuardSchema = z.strictObject({
    nextChange: z.int().nonnegative().optional(),
});

const taskGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('taskGuard'),
    /** Percentage of Task.totalDuration */
    minProgress: z.number().min(0).max(1),
    taskId: taskSchema.shape.taskTypeId,
});
export type TaskGuard = Immutable<z.infer<typeof taskGuardSchema>>;

const timerGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('timerGuard'),
    /** Percentage of Timer.totalDuration past */
    minProgress: z.number().min(0).max(1),
    timerId: timerSchema.shape.id,
});
export type TimerGuard = Immutable<z.infer<typeof timerGuardSchema>>;

/* Because AndGuard's and NotGuard's are recursive types, their type is not
 * directly inferred from their schema.
 *
 * They also can not be defined using `Immutable<>`, presumably because
 * there is some interaction with the recursive nature of it.
 *
 * The current workaround is to define them using interfaces.
 */

const andGuardSchema = z.object({
    ...baseGuardSchema.shape,
    type: z.literal('andGuard'),
    get guards() {
        return z.array(guardSchema);
    },
});
export interface AndGuard {
    type: 'andGuard';
    guards: Immutable<_Guard[]>;
    nextChange?: number;
}

const notGuardSchema = z.strictObject({
    ...baseGuardSchema.shape,
    type: z.literal('notGuard'),
    get guard() {
        return guardSchema;
    },
});
export interface NotGuard {
    type: 'notGuard';
    guard: Immutable<_Guard>;
    nextChange?: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type _Guard = AndGuard | NotGuard | TaskGuard | TimerGuard;
export const guardSchema: z.ZodType<_Guard> = z.lazy(() =>
    z.discriminatedUnion('type', [
        taskGuardSchema,
        timerGuardSchema,
        andGuardSchema,
        notGuardSchema,
    ])
);
export type Guard = Immutable<z.infer<typeof guardSchema>>;

export type TaskTreeGuard = TaskGuard & { readonly parent: TreeGuard | null };
export type TimerTreeGuard = TimerGuard & { readonly parent: TreeGuard | null };
export interface AndTreeGuard {
    type: 'andGuard';
    guards: TreeGuard[];
    nextChange?: number;
    parent: TreeGuard | null;
}

export interface NotTreeGuard {
    type: 'notGuard';
    guard: TreeGuard;
    nextChange?: number;
    parent: TreeGuard | null;
}

export type TreeGuard =
    | AndTreeGuard
    | NotTreeGuard
    | TaskTreeGuard
    | TimerTreeGuard;

export function decodeTreeGuard(
    wire: Guard,
    parent: TreeGuard | null
): TreeGuard {
    switch (wire.type) {
        case 'andGuard': {
            const node: AndTreeGuard = {
                type: 'andGuard' as const,
                guards: [] as TreeGuard[],
                parent,
            };
            node.guards = wire.guards.map((g) => decodeTreeGuard(g, node));
            return node;
        }
        case 'notGuard': {
            const node: any = {
                type: 'notGuard' as const,
                guard: null,
                parent,
            };
            node.guard = decodeTreeGuard(wire.guard, node);
            return node as NotTreeGuard;
        }
        case 'taskGuard':
        case 'timerGuard':
            return { ...wire, parent };
    }
}

export function encodeTreeGuard(g: TreeGuard): Guard {
    switch (g.type) {
        case 'andGuard':
            return { type: 'andGuard', guards: g.guards.map(encodeTreeGuard) };
        case 'notGuard':
            return { type: 'notGuard', guard: encodeTreeGuard(g.guard) };
        case 'taskGuard':
        case 'timerGuard': {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { parent: _, ...rest } = g;
            return rest;
        }
    }
}

export const treeGuardCodec = z.codec(guardSchema, z.custom<TreeGuard>(), {
    decode: (wire) => decodeTreeGuard(wire, null),
    encode: (g) => encodeTreeGuard(g),
});

const stateMachineStateIdSchema = uuidSchema.brand<'StateMachineStateId'>();
export const transitionSchema = z.object({
    id: uuidSchema,
    targetState: stateMachineStateIdSchema,
    guard: treeGuardCodec,
});

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

export type Transition = Immutable<z.infer<typeof transitionSchema>>;

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

export const runtimeStateMachineSchema = stateMachineSchema.safeExtend({
    taskGuards: z.record(
        taskTypeSchema.shape.id,
        z.record(
            stateMachineStateIdSchema,
            z.record(
                transitionSchema.shape.id,
                z.array(transitionSchema.shape.guard)
            )
        )
    ),
});

function addTaskGuards(
    stateId: StateMachineState['id'],
    transitionId: Transition['id'],
    guard: TreeGuard,
    taskGuards: {
        [key: TaskType['id']]: {
            [key: StateMachineState['id']]: {
                [key: Transition['id']]: TaskTreeGuard[];
            };
        };
    }
): void {
    switch (guard.type) {
        case 'taskGuard':
            (((taskGuards[guard.taskId] ??= {})[stateId] ??= {})[
                transitionId
            ] ??= []).push(guard);
            return;
        case 'timerGuard':
            return;
        case 'andGuard':
            for (const g of guard.guards)
                addTaskGuards(stateId, transitionId, g, taskGuards);
            return;
        case 'notGuard':
            addTaskGuards(stateId, transitionId, guard.guard, taskGuards);
    }
}

export const stateMachineCodec = z.codec(
    stateMachineSchema,
    runtimeStateMachineSchema,
    {
        encode(stateMachine) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { taskGuards, ...rest } = stateMachine;
            return rest as z.infer<typeof stateMachineSchema>;
        },
        decode(stateMachine) {
            const taskGuards: {
                [key: TaskType['id']]: {
                    [key: StateMachineState['id']]: {
                        [key: Transition['id']]: TaskTreeGuard[];
                    };
                };
            } = {};
            for (const state of Object.values(stateMachine.states)) {
                for (const transition of Object.values(
                    state.outgoingTransitions
                )) {
                    addTaskGuards(
                        state.id,
                        transition.id,
                        transition.guard,
                        taskGuards
                    );
                }
            }
            return { ...stateMachine, taskGuards } satisfies z.infer<
                typeof runtimeStateMachineSchema
            >;
        },
    }
);
export type StateMachine = Immutable<z.infer<typeof stateMachineCodec>>;

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
        stateMachine.taskTimeSpent[taskId] = {
            timeSpent: 0,
            lastUpdatedAt: currentTime,
        };
        return;
    }

    const nAssignedPersonnel = Object.values(
        stateMachine.assignedPersonnel
    ).filter((_taskId) => _taskId === taskId).length;

    taskProgress.timeSpent =
        taskProgress.timeSpent +
        (currentTime - taskProgress.lastUpdatedAt) *
            nAssignedPersonnel *
            state.possibleTasks[taskId];
    taskProgress.lastUpdatedAt = currentTime;
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
    const state = currentStateOf(stateMachine);
    let earliestTimestamp = Infinity;
    let earliestEvent: StateMachineEvent | null = null;

    for (const transition of transitions) {
        const guard = transition.guard;
        const eventTimestamp = getGuardTimestamp(
            stateMachine,
            exerciseState,
            state,
            guard
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

    return earliestEvent;
}

function propagateTaskChange(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    state: WritableDraft<StateMachineState>,
    transitionId: Transition['id'],
    guard: WritableDraft<TreeGuard> | null,
    oldTimestamp?: number,
    newTimestamp?: number
): StateMachineEvent | null {
    if (guard === null) {
        if (oldTimestamp === newTimestamp) return null;
        return newStateMachineEvent(
            newTimestamp!,
            technicalChallengeId,
            stateMachine.id,
            transitionId
        );
    }
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

            const thisOldTimestamp = guard.nextChange!;
            guard.nextChange = nextChange;

            return propagateTaskChange(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                state,
                transitionId,
                guard.parent,
                thisOldTimestamp,
                nextChange
            );
        }
        case 'notGuard': {
            return propagateTaskChange(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                state,
                transitionId,
                guard.parent,
                oldTimestamp,
                newTimestamp
            );
        }
        case 'andGuard': {
            if (guard.nextChange! !== oldTimestamp) {
                // This guard did not define this trees next event
                if (newTimestamp! <= guard.nextChange!) {
                    // The new timestamp is before or equal to the nextChange timestamp, so it doesn't change the next event of this tree
                    return null;
                }
                // The new timestamp is after the nextChange timestamp, so this is the new nextChange timestamp
                const thisOldTimestamp = guard.nextChange!;
                guard.nextChange = newTimestamp;
                return propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    state,
                    transitionId,
                    guard.parent,
                    thisOldTimestamp,
                    newTimestamp
                );
            }

            // This guard might have defined this trees next event
            const subGuards = guard.guards.map((g) => g.nextChange!);

            const nextChange = Math.max(...subGuards);
            if (nextChange !== guard.nextChange) {
                const thisOldTimestamp = guard.nextChange;
                guard.nextChange = nextChange;
                return propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    state,
                    transitionId,
                    guard.parent,
                    thisOldTimestamp,
                    nextChange
                );
            }
            return null;
        }
        case 'timerGuard':
            throw new Error('This should be unreachable.');
    }
}

function getGuardTimestamp(
    stateMachine: WritableDraft<StateMachine>,
    exerciseState: WritableDraft<ExerciseState>,
    state: WritableDraft<StateMachineState>,
    guard: WritableDraft<TreeGuard>
): {
    current: boolean;
    nextChange: number;
} {
    switch (guard.type) {
        case 'notGuard': {
            const subGuard = getGuardTimestamp(
                stateMachine,
                exerciseState,
                state,
                guard.guard
            );
            guard.nextChange ??= subGuard.nextChange;
            return {
                current: !subGuard.current,
                nextChange: subGuard.nextChange,
            };
        }
        case 'andGuard': {
            const subGuards = guard.guards.map((g) =>
                getGuardTimestamp(stateMachine, exerciseState, state, g)
            );
            const current = subGuards.reduce((v, g) => v && g.current, true);
            const nextChange = current
                ? Math.min(...subGuards.map((g) => g.nextChange))
                : Math.max(
                      ...subGuards
                          .filter((g) => !g.current)
                          .map((g) => g.nextChange)
                  );

            guard.nextChange ??= nextChange;
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
            )
                return { current: true, nextChange: Infinity };

            const totalDuration =
                stateMachine.tasks[guard.taskId]!.totalDuration;
            const remainingDuration =
                guard.minProgress * totalDuration - taskProgress.timeSpent;
            const nextChange =
                exerciseState.currentTime +
                remainingDuration / taskProgress.rate;

            guard.nextChange ??= nextChange;

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
            )
                return { current: true, nextChange: Infinity };

            const timer = stateMachine.timers[guard.timerId]!;
            const nextChange =
                stateMachine.simulationStartTime +
                guard.minProgress * timer.totalDuration;

            guard.nextChange ??= nextChange;

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
        remove(queue, stateMachineId);
        return;
    }
    if (queue.indices[stateMachineId] === undefined) {
        insert(queue, earliestEvent);
        return;
    }
    const current = queue.events[queue.indices[stateMachineId]]!;
    if (
        current.transitionId === earliestEvent.transitionId &&
        current.timestamp === earliestEvent.timestamp
    )
        return;
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

    if (potentialTransitions.length === 0) {
        remove(exerciseState.stateMachineEventQueue, stateMachine.id);
    }

    const earliestEvent = computeEarliestEvent(
        exerciseState,
        technicalChallengeId,
        stateMachine,
        potentialTransitions
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
    const affectedGuards = stateMachine.taskGuards[taskId]?.[
        state.id
    ] as WritableDraft<{ [key: Transition['id']]: TreeGuard[] }>;

    let newEvent: StateMachineEvent | undefined;
    for (const [transitionId, guards] of Object.entries(affectedGuards)) {
        const events = guards
            .map((guard) =>
                propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    state,
                    transitionId,
                    guard
                )
            )
            .filter((e) => e !== null);
        for (const event of events) {
            if (event.timestamp < (newEvent?.timestamp ?? Infinity)) {
                newEvent = event;
            }
        }
    }

    if (newEvent === undefined) return;

    const queue = exerciseState.stateMachineEventQueue;
    if (queue.indices[stateMachine.id] === undefined) {
        insert(queue, newEvent);
        return;
    }
    const current = queue.events[queue.indices[stateMachine.id]!]!;
    if (newEvent.timestamp < current.timestamp) {
        modify(queue, stateMachine.id, newEvent);
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

    logStateTransition?.(nextTransition.targetState);

    updateAllTasksProgress(exerciseState, stateMachine);

    stateMachine.currentStateId = nextTransition.targetState;

    const unassignedPersonnel = unassignFromNonexistentTasks(stateMachine);

    if (unassignedPersonnel.length > 0 && logPersonnelUnassigned) {
        for (const { personnelId, taskTypeId } of unassignedPersonnel) {
            logPersonnelUnassigned(personnelId, taskTypeId);
        }
    }

    updateEventQueue(exerciseState, technicalChallengeId, stateMachine);
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const queue = draftState.stateMachineEventQueue;
    console.log(JSON.stringify(queue, null, 2));
    console.log(
        `Comparing ${peek(queue)?.timestamp} with ${draftState.currentTime}`
    );

    while ((peek(queue)?.timestamp ?? Infinity) <= draftState.currentTime) {
        const event = pop(queue)!;
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
}
