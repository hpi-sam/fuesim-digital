import type { WritableDraft } from 'immer';
import type { Personnel } from '../models/personnel.js';
import type { TaskType } from '../models/task-type.js';
import type { StateMachineEvent } from '../models/technical-challenge/event.js';
import { newStateMachineEvent } from '../models/technical-challenge/event.js';
import type { GuardIndex } from '../models/technical-challenge/guard-index.js';
import { getGuardIndex } from '../models/technical-challenge/guard-index.js';
import type {
    TechnicalChallengeId,
    GuardId,
    StateMachineId,
    TransitionId,
} from '../models/technical-challenge/ids.js';
import type {
    StateMachine,
    StateMachineState,
    Guard,
    Transition,
    GuardProgress,
    TaskGuard,
    TaskProgress,
    Timer,
    TimerGuard,
    TimerProgress,
} from '../models/technical-challenge/state-machine.js';
import type { ExerciseState } from '../state.js';
import {
    logTechnicalChallengeStateTransition,
    logTechnicalChallengePersonnelUnassigned,
} from '../store/action-reducers/utils/log.js';
import { TypeAssertedObject } from '../utils/type-asserted-object.js';
import { insert, modify, peek, pop, remove } from './events.js';

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
        `[getTaskProgress]\n\ttaskId=${taskId}\n\tt=${currentTime}\n\tnAssigned=${nAssignedPersonnel}\n\trate=${rate}\n\ttimeSpent=${timeSpent} progress=${(progressPercentage * 100).toFixed(2)}%`
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
            `[updateTaskProgress]\n\ttaskId=${taskId}\n\tt=${currentTime}\n\tINIT (first seen)`
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
        `[updateTaskProgress]\n\ttaskId=${taskId}\n\tt=${currentTime}\n\tnAssigned=${nAssignedPersonnel}\n\trate=${rate}\n\tdelta=${delta.toFixed(3)}\n\ttimeSpent: ${oldTimeSpent.toFixed(3)}→${taskProgress.timeSpent.toFixed(3)}`
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
            `[computeEarliestEvent]\n\ttransitionId=${transition.id}\n\tcurrent=${eventTimestamp.current}\n\tnextChange=${eventTimestamp.nextChange}`
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
        `[computeEarliestEvent]\n\t→ earliest: transitionId=${earliestEvent?.transitionId ?? 'none'}\n\tt=${earliestEvent?.timestamp ?? 'null'}`
    );
    return earliestEvent;
}

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
                `[propagate:task]\n\ttaskId=${guard.taskId}\n\ttransitionId=${transitionId}\n\tnextChange: ${thisOldTimestamp}→${nextChange}\n\tparentId=${parentId ?? 'null(root)'}`
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
                `[propagate:not]\n\ttransitionId=${transitionId}\n\tpassthrough old=${oldTimestamp}\n\tnew=${newTimestamp}\n\tparentId=${parentId ?? 'null(root)'}`
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
                        `[propagate:and]\n\ttransitionId=${transitionId}\n\tNOT the defining child (nextChange=${currentNextChange} !== old=${oldTimestamp})\n\tnew=${newTimestamp} ≤ nextChange → STOP`
                    );
                    return null;
                }
                // The new timestamp is after the nextChange timestamp, so this is the new nextChange timestamp
                index.nextChangeOf.set(guardId, newTimestamp!);
                console.log(
                    `[propagate:and]\n\ttransitionId=${transitionId}\n\tNOT the defining child but new=${newTimestamp} > nextChange=${currentNextChange}\n\t→ nextChange: ${currentNextChange}→${newTimestamp}\n\tparentId=${parentId ?? 'null(root)'}`
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
            const subGuards = guard.guards.map(
                (g) => index.nextChangeOf.get(g.id)!
            );

            const nextChange = Math.max(...subGuards);
            if (nextChange !== currentNextChange) {
                index.nextChangeOf.set(guardId, nextChange);
                console.log(
                    `[propagate:and]\n\ttransitionId=${transitionId}\n\tWAS the defining child, subGuards=[${subGuards.join(',')}]\n\tnextChange: ${currentNextChange}→${nextChange}\n\tparentId=${parentId ?? 'null(root)'}`
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
                `[propagate:and]\n\ttransitionId=${transitionId}\n\tWAS the defining child, subGuards=[${subGuards.join(',')}]\n\tnextChange unchanged=${currentNextChange} → STOP`
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
                `[guardTs:not]\n\tchild.current=${subGuard.current}\n\tchild.nextChange=${subGuard.nextChange}\n\t→ current=${!subGuard.current}${cached ? ' [cached]' : ''}`
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
                `[guardTs:and]\n\tchildren=[${subGuards.map((g) => `{cur:${g.current},nc:${g.nextChange}}`).join(',')}]\n\tallFulfilled=${current}\n\tnextChange=${nextChange}${cached ? ' [cached]' : ''}`
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
                    `[guardTs:task]\n\ttaskId=${guard.taskId}\n\tprogress=${(taskProgress.progressPercentage * 100).toFixed(2)}%\n\tFULFILLED → nextChange=Infinity`
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
                `[guardTs:task]\n\ttaskId=${guard.taskId}\n\tprogress=${(taskProgress.progressPercentage * 100).toFixed(2)}%\n\trate=${taskProgress.rate}\n\tremaining=${remainingDuration.toFixed(3)}\n\tnextChange=${nextChange}${cached ? ' [cached]' : ''}`
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
                    `[guardTs:timer]\n\ttimerId=${guard.timerId}\n\tFULFILLED → nextChange=Infinity`
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
                `[guardTs:timer]\n\ttimerId=${guard.timerId}\n\tsimulationStartTime=${stateMachine.simulationStartTime}\n\tminProgress=${guard.minProgress}\n\ttotalDuration=${timer.totalDuration}\n\tnextChange=${nextChange}${cached ? ' [cached]' : ''}`
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
            `[applyEvent:remove]\n\tsmId=${stateMachineId}\n\tno event to schedule`
        );
        remove(queue, stateMachineId);
        return;
    }
    if (queue.indices[stateMachineId] === undefined) {
        console.log(
            `[applyEvent:insert]\n\tsmId=${stateMachineId}\n\ttransitionId=${earliestEvent.transitionId}\n\tt=${earliestEvent.timestamp}`
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
            `[applyEvent:noOp]\n\tsmId=${stateMachineId}\n\ttransitionId=${earliestEvent.transitionId}\n\tt=${earliestEvent.timestamp}\n\tunchanged`
        );
        return;
    }
    console.log(
        `[applyEvent:update]\n\tsmId=${stateMachineId}\n\ttransitionId: ${current.transitionId}→${earliestEvent.transitionId}\n\tt: ${current.timestamp}→${earliestEvent.timestamp}`
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
        `[updateQueue:full]\n\tsmId=${stateMachine.id}\n\tcurrentStateId=${state.id}\n\tnTransitions=${potentialTransitions.length}\n\tt=${exerciseState.currentTime}`
    );

    if (potentialTransitions.length === 0) {
        console.log(
            `[updateQueue:full]\n\tsmId=${stateMachine.id}\n\tno outgoing transitions → removing from queue`
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
        `[updateQueue:done]\n\tsmId=${stateMachine.id}\n\t→ event t=${earliestEvent?.timestamp ?? 'null'}\n\ttransitionId=${earliestEvent?.transitionId ?? 'null'}`
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
        new Map<TransitionId, GuardId[]>();

    const nAffectedTransitions = [...affectedTransitions.keys()].filter(
        (transitionId) => transitionId in state.outgoingTransitions
    ).length;
    console.log(
        `[updateQueueTask]\n\ttaskId=${taskId}\n\tsmId=${stateMachine.id}\n\tstateId=${state.id}\n\tnAffectedTransitions=${nAffectedTransitions}\n\tt=${exerciseState.currentTime}`
    );

    let newEvent: StateMachineEvent | undefined;
    for (const [transitionId, guardIds] of affectedTransitions) {
        // Only transitions outgoing from the *current* state are relevant.
        if (!(transitionId in state.outgoingTransitions)) continue;

        console.log(
            `[updateQueueTask:transition]\n\ttransitionId=${transitionId}\n\tnGuardLeaves=${guardIds.length}`
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
            `[updateQueueTask:transition]\n\ttransitionId=${transitionId}\n\tpropagation produced ${events.length} event(s): [${events.map((e) => e.timestamp).join(',')}]`
        );
        for (const event of events) {
            if (event.timestamp < (newEvent?.timestamp ?? Infinity)) {
                newEvent = event;
            }
        }
    }

    if (newEvent === undefined) {
        console.log(
            `[updateQueueTask]\n\ttaskId=${taskId}\n\t→ no event change`
        );
        return;
    }

    const queue = exerciseState.stateMachineEventQueue;
    if (queue.indices[stateMachine.id] === undefined) {
        console.log(
            `[updateQueueTask:insert]\n\tsmId=${stateMachine.id}\n\ttransitionId=${newEvent.transitionId}\n\tt=${newEvent.timestamp}`
        );
        insert(queue, newEvent);
        return;
    }
    const current = queue.events[queue.indices[stateMachine.id]!]!;
    if (newEvent.timestamp < current.timestamp) {
        console.log(
            `[updateQueueTask:update]\n\tsmId=${stateMachine.id}\n\ttransitionId: ${current.transitionId}→${newEvent.transitionId}\n\tt: ${current.timestamp}→${newEvent.timestamp}`
        );
        modify(queue, stateMachine.id, newEvent);
    } else {
        console.log(
            `[updateQueueTask:noOp]\n\tsmId=${stateMachine.id}\n\tnew t=${newEvent.timestamp} ≥ current t=${current.timestamp}\n\t→ unchanged`
        );
    }
}

function simulateStateMachine(
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    transitionId: TransitionId,
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
        `[simulate]\n\tsmId=${stateMachine.id}\n\ttransitionId=${transitionId}\n\tstate: ${stateMachine.currentStateId}→${nextTransition.targetState}\n\tt=${exerciseState.currentTime}`
    );
    for (const [taskId, taskTimeSpent] of Object.entries(
        stateMachine.taskTimeSpent
    )) {
        console.log(
            `[simulate:taskProgress]\n\ttaskId=${taskId}\n\ttimeSpent=${taskTimeSpent.timeSpent.toFixed(3)}\n\tlastUpdatedAt=${taskTimeSpent.lastUpdatedAt}`
        );
    }

    logStateTransition?.(nextTransition.targetState);

    updateAllTasksProgress(exerciseState, stateMachine);

    stateMachine.currentStateId = nextTransition.targetState;

    const unassignedPersonnel = unassignFromNonexistentTasks(stateMachine);

    if (unassignedPersonnel.length > 0) {
        console.log(
            `[simulate:unassign]\n\tsmId=${stateMachine.id}\n\tunassigned ${unassignedPersonnel.map((p) => `${p.personnelId}(task:${p.taskTypeId})`).join(', ')}`
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
        `[tick]\n\tcurrentTime=${draftState.currentTime}\n\tnextEventTime=${nextEvent?.timestamp ?? 'none'}\n\tsmId=${nextEvent?.stateMachineId ?? '-'}\n\ttransitionId=${nextEvent?.transitionId ?? '-'}`
    );

    let nProcessed = 0;
    while ((peek(queue)?.timestamp ?? Infinity) <= draftState.currentTime) {
        const event = pop(queue)!;
        console.log(
            `[tick:fire]\n\t#${nProcessed}\n\tsmId=${event.stateMachineId}\n\ttransitionId=${event.transitionId}\n\teventTime=${event.timestamp}\n\tcurrentTime=${draftState.currentTime}`
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
    console.log(`[tick:done]\n\tprocessed ${nProcessed} event(s) this tick`);
}
