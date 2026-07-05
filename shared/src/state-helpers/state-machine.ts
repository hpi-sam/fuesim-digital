import type { WritableDraft } from 'immer';
import type { Personnel } from '../models/personnel.js';
import type { TaskType } from '../models/task-type.js';
import type { StateMachineEvent } from '../models/technical-challenge/event.js';
import { newStateMachineEvent } from '../models/technical-challenge/event.js';
import type { CurrentValue } from '../models/technical-challenge/guard-index.js';
import { GuardIndex } from '../models/technical-challenge/guard-index.js';
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
import { insert, modify, peek, pop, removeByStateMachineId } from './events.js';

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

    if (!state.possibleTasks[taskId]) {
        console.log(
            `[updateTaskProgress:error] updateTaskProgress called with invalid taskId ${taskId}`
        );
        return;
    }

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

function getTimerGuardEventTimestamp(
    stateMachine: StateMachine,
    guard: TimerGuard
): number {
    const timer = stateMachine.timers[guard.timerId]!;
    const eventTimestamp =
        stateMachine.simulationStartTime +
        guard.minProgress * timer.totalDuration;

    return eventTimestamp;
}

function getTaskGuardEventTimestamp(
    exerciseState: ExerciseState,
    stateMachine: StateMachine,
    guard: TaskGuard
): number {
    const taskProgress = getTaskProgress(
        guard.taskId,
        stateMachine,
        exerciseState.currentTime
    );

    const totalDuration = stateMachine.tasks[guard.taskId]!.totalDuration;
    const remainingDuration =
        guard.minProgress * totalDuration - taskProgress.timeSpent;
    const eventTimestamp =
        exerciseState.currentTime + remainingDuration / taskProgress.rate;

    return eventTimestamp;
}

function insertLeafEvents(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    guard: Guard
): void {
    const queue = exerciseState.stateMachineEventQueue;
    switch (guard.type) {
        case 'taskGuard': {
            const eventTimestamp = getTaskGuardEventTimestamp(
                exerciseState,
                stateMachine,
                guard
            );
            insert(
                queue,
                newStateMachineEvent(
                    eventTimestamp,
                    technicalChallengeId,
                    stateMachine.id,
                    guard.id
                )
            );
            break;
        }
        case 'timerGuard': {
            const eventTimestamp = getTimerGuardEventTimestamp(
                stateMachine,
                guard
            );
            insert(
                queue,
                newStateMachineEvent(
                    eventTimestamp,
                    technicalChallengeId,
                    stateMachine.id,
                    guard.id
                )
            );
            break;
        }
        case 'andGuard': {
            for (const subGuard of guard.guards)
                insertLeafEvents(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    subGuard
                );
            break;
        }
        case 'notGuard': {
            insertLeafEvents(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                guard.guard
            );
            break;
        }
    }
}

function propagateValueChange(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    index: GuardIndex,
    guardId: GuardId
): TransitionId | null {
    const {
        guard,
        parent: parentId,
        transition: transitionId,
    } = index.getEntry(guardId)!;

    console.log(`[propagateValueChange]\n\tguardId: ${guardId}`);

    const value = getCurrentValue(
        stateMachine,
        exerciseState,
        index,
        guard,
        true
    );

    if (parentId) {
        console.log(`\thas parent`);
        if (value.valid) {
            console.log(`\tvalue was valid, terminating …`);
            return null;
        }
        console.log(`\tvalue was stale, propagating …`);

        return propagateValueChange(
            exerciseState,
            technicalChallengeId,
            stateMachine,
            index,
            parentId
        );
    }

    console.log(`\tdoesn't have parent`);
    if (!value.value) {
        console.log(`\tvalue is false, terminating …`);
        return null;
    }

    console.log(`\tvalue is true, returning transition id …`);
    return transitionId;
}

/**
 * The `CurrentValue` returned by this function has the following semantics:
 * `valid` = false if the cached value was updated
 * `valid` = true if the cached value was valid (either marked as such by the cache or invalid cached value re-calculated)
 */
function getCurrentValue(
    stateMachine: WritableDraft<StateMachine>,
    exerciseState: WritableDraft<ExerciseState>,
    index: GuardIndex,
    guard: Guard,
    mayBeInvalid: boolean = false
): CurrentValue {
    let currentValue = index.getCurrentValue(guard.id);
    let valid: boolean;
    if (currentValue === null) {
        currentValue = calculateCurrentGuardValue(
            stateMachine,
            exerciseState,
            index,
            guard
        );
        index.setCurrentValue(guard.id, currentValue);
        valid = false;
    } else if (mayBeInvalid) {
        const newValue = calculateCurrentGuardValue(
            stateMachine,
            exerciseState,
            index,
            guard
        );
        index.setCurrentValue(guard.id, newValue);
        valid = currentValue === newValue;
        currentValue = newValue;
    } else {
        valid = true;
    }

    return {
        value: currentValue,
        valid,
    };
}

function calculateCurrentGuardValue(
    stateMachine: WritableDraft<StateMachine>,
    exerciseState: WritableDraft<ExerciseState>,
    index: GuardIndex,
    guard: Guard
): boolean {
    switch (guard.type) {
        case 'notGuard': {
            return !getCurrentValue(
                stateMachine,
                exerciseState,
                index,
                guard.guard
            ).value;
        }
        case 'andGuard': {
            const subGuardValues = guard.guards.map((g) =>
                getCurrentValue(stateMachine, exerciseState, index, g)
            );
            const currentValue = subGuardValues.reduce(
                (v, g) => v && g.value,
                true
            );
            return currentValue;
        }
        case 'taskGuard': {
            return isTaskGuardFulfilled(
                guard,
                stateMachine,
                exerciseState.currentTime
            );
        }
        case 'timerGuard': {
            return isTimerGuardFulfilled(
                guard,
                stateMachine,
                exerciseState.currentTime
            );
        }
    }
}

function applyEventToQueue(
    exerciseState: WritableDraft<ExerciseState>,
    stateMachineId: StateMachineId,
    event: StateMachineEvent | null
): void {
    const queue = exerciseState.stateMachineEventQueue;

    if (event === null) {
        console.log(
            `[applyEvent:remove]\n\tsmId=${stateMachineId}\n\tno event to schedule`
        );
        throw new Error("'applyToEventQueue' called without event");
    }
    if (queue.guardIndices[event.guardId] === undefined) {
        console.log(
            `[applyEvent:insert]\n\tsmId=${stateMachineId}\n\tguardId=${event.guardId}\n\tt=${event.timestamp}`
        );
        insert(queue, event);
        return;
    }
    const current = queue.events[queue.guardIndices[event.guardId]!]!;
    if (
        current.guardId === event.guardId &&
        current.timestamp === event.timestamp
    ) {
        console.log(
            `[applyEvent:noOp]\n\tsmId=${stateMachineId}\n\tguardId=${event.guardId}\n\tt=${event.timestamp}\n\tunchanged`
        );
        return;
    }
    console.log(
        `[applyEvent:update]\n\tsmId=${stateMachineId}\n\tguardId: ${current.guardId}→${event.guardId}\n\tt: ${current.timestamp}→${event.timestamp}`
    );
    modify(queue, event.guardId, event);
}

/** Full recomputation across all transitions — use after state transitions and on initial creation. */
export function updateEventQueue(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>
) {
    removeByStateMachineId(
        exerciseState.stateMachineEventQueue,
        stateMachine.id
    );

    const state = currentStateOf(stateMachine);

    const potentialTransitions = Object.values(state.outgoingTransitions);

    console.log(
        `[updateQueue:full]\n\tsmId=${stateMachine.id}\n\tcurrentStateId=${state.id}\n\tnTransitions=${potentialTransitions.length}\n\tt=${exerciseState.currentTime}`
    );

    for (const transition of potentialTransitions) {
        insertLeafEvents(
            exerciseState,
            technicalChallengeId,
            stateMachine,
            transition.guard
        );
    }
}

/**
 * Targeted update after a personnel assignment changes.
 */
export function updateEventQueueAfterTaskChange(
    exerciseState: WritableDraft<ExerciseState>,
    stateMachine: WritableDraft<StateMachine>,
    taskId: TaskType['id']
): void {
    const index = GuardIndex.getIndex(stateMachine);
    const queue = exerciseState.stateMachineEventQueue;
    const affectedGuards = index
        .getTaskGuardsOf(taskId)
        .filter((guardId) => guardId in queue.guardIndices);

    for (const guardId of affectedGuards) {
        const guard = index.getGuard(guardId);
        if (!guard)
            throw new Error(
                "Encountered 'guardId' in 'taskGuardsOf' without 'guard' in index."
            );

        switch (guard.type) {
            case 'andGuard':
            case 'notGuard':
                continue;
            case 'taskGuard':
            case 'timerGuard': {
                const eventTimestamp =
                    guard.type === 'taskGuard'
                        ? getTaskGuardEventTimestamp(
                              exerciseState,
                              stateMachine,
                              guard
                          )
                        : getTimerGuardEventTimestamp(stateMachine, guard);
                if (
                    queue.events[queue.guardIndices[guard.id]!]!.timestamp !==
                    eventTimestamp
                ) {
                    modify(queue, guardId, { timestamp: eventTimestamp });
                }
            }
        }
    }
}

function simulateStateMachine(
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    guardId: GuardId,
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number,
    logStateTransition?: (targetStateId: StateMachineState['id']) => void,
    logPersonnelUnassigned?: (
        personnelId: Personnel['id'],
        taskTypeId: TaskType['id']
    ) => void
): void {
    const index = GuardIndex.getIndex(stateMachine);
    const guard = index.getGuard(guardId);

    if (!guard) {
        console.log(
            `[simulate:error] simulateStateMachine called with invalid guardId '${guardId}'`
        );
        return;
    }

    const transitionId = propagateValueChange(
        exerciseState,
        technicalChallengeId,
        stateMachine,
        index,
        guardId
    );

    if (!transitionId) {
        console.log(`[simulate:noOp] value change did not lead to transition`);
        return;
    }

    const state = currentStateOf(stateMachine);
    const transition = state.outgoingTransitions[transitionId];

    if (!transition) {
        console.log(
            `[simulate:error] no possible transition found for transitionId '${transitionId}'`
        );
        return;
    }

    logStateTransition?.(transition.targetState);

    updateAllTasksProgress(exerciseState, stateMachine);

    stateMachine.currentStateId = transition.targetState;

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
        `[tick]\n\tcurrentTime=${draftState.currentTime}\n\tnextEventTime=${nextEvent?.timestamp ?? 'none'}\n\tsmId=${nextEvent?.stateMachineId ?? '-'}\n\tguardId=${nextEvent?.guardId ?? '-'}`
    );

    let nProcessed = 0;
    while ((peek(queue)?.timestamp ?? Infinity) <= draftState.currentTime) {
        const event = pop(queue)!;
        console.log(
            `[tick:fire]\n\t#${nProcessed}\n\tsmId=${event.stateMachineId}\n\tguardId=${event.guardId}\n\teventTime=${event.timestamp}\n\tcurrentTime=${draftState.currentTime}`
        );
        nProcessed++;
        const stateMachine =
            draftState.technicalChallenges[event.technicalChallengeId]!
                .stateMachines[event.stateMachineId]!;
        simulateStateMachine(
            event.technicalChallengeId,
            stateMachine,
            event.guardId,
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
