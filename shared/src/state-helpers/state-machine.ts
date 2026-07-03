import type { WritableDraft } from 'immer';
import type { Personnel } from '../models/personnel.js';
import type { TaskType } from '../models/task-type.js';
import type { StateMachineEvent } from '../models/technical-challenge/event.js';
import { newStateMachineEvent } from '../models/technical-challenge/event.js';
import type {
    GuardIndex,
    NextChange,
} from '../models/technical-challenge/guard-index.js';
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
        const eventTimestamp = calculateGuardNextChange(
            stateMachine,
            exerciseState,
            index,
            guard,
            true
        );

        console.log(
            `[computeEarliestEvent]\n\ttransitionId=${transition.id}\n\tcurrent=${eventTimestamp.currentValue}\n\tnextChange=${eventTimestamp.changeTimestamp}`
        );

        if (eventTimestamp.changeTimestamp >= earliestTimestamp) continue;
        earliestTimestamp = eventTimestamp.changeTimestamp;
        earliestEvent = newStateMachineEvent(
            eventTimestamp.changeTimestamp,
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

function didChangesChange(a: NextChange, b: NextChange) {
    return (
        a.changeTimestamp !== b.changeTimestamp || a.nextValue !== b.nextValue
    );
}

function updateMax(
    currentMax: number,
    oldValue: number,
    newValue: number,
    rescan: () => number
) {
    if (newValue >= currentMax) return newValue;
    if (oldValue < currentMax) return currentMax;
    return rescan();
}

function updateMin(
    currentMin: number,
    oldValue: number,
    newValue: number,
    rescan: () => number
) {
    if (newValue <= currentMin) return newValue;
    if (oldValue > currentMin) return currentMin;
    return rescan();
}

function propagateTaskChange(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallengeId: TechnicalChallengeId,
    stateMachine: WritableDraft<StateMachine>,
    index: GuardIndex,
    transitionId: Transition['id'],
    guardId: GuardId | undefined,
    childPreviousNextChange?: NextChange,
    childNextChange?: NextChange
): StateMachineEvent | null {
    if (guardId === undefined) {
        console.log(
            `[propagateTaskChange]\n\tchildPreviousNextChange: ${JSON.stringify(childPreviousNextChange, null, 2)}\n\tchildNextChange: ${JSON.stringify(childNextChange, null, 2)}`
        );
        if (childPreviousNextChange === childNextChange) return null;
        console.log('\n\tBuilding new event …');
        return newStateMachineEvent(
            childNextChange!.changeTimestamp,
            technicalChallengeId,
            stateMachine.id,
            transitionId
        );
    }
    const guard = index.guardById.get(guardId)!;
    const parentId = index.parentOf.get(guardId) ?? undefined;
    switch (guard.type) {
        case 'taskGuard': {
            const nextChange = calculateGuardNextChange(
                stateMachine,
                exerciseState,
                index,
                guard,
                false
            );
            const previousNextChange = index.nextChangeOf.get(guardId)!;
            index.nextChangeOf.set(guardId, nextChange);
            console.log(
                `[propagate:task]\n\ttaskId=${guard.taskId}\n\ttransitionId=${transitionId}\n\tnextChange: ${previousNextChange.changeTimestamp}→${nextChange.changeTimestamp}\n\tparentId=${parentId ?? 'null(root)'}`
            );

            if (!didChangesChange(previousNextChange, nextChange)) return null;

            return propagateTaskChange(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                index,
                transitionId,
                parentId,
                previousNextChange,
                nextChange
            );
        }
        case 'notGuard': {
            console.log(
                `[propagate:not]\n\ttransitionId=${transitionId}\n\tpassthrough old=${JSON.stringify(childPreviousNextChange, null, 2)}\n\tnew=${JSON.stringify(childNextChange, null, 2)}\n\tparentId=${parentId ?? 'null(root)'}`
            );

            // If we reach this, the child must have changed, which means this will also change -- no need to check
            const nextChange: NextChange = {
                currentValue: !childNextChange!.currentValue,
                nextValue: !childNextChange!.nextValue,
                changeTimestamp: childNextChange!.changeTimestamp,
            };
            const previousNextChange = index.nextChangeOf.get(guardId)!;
            index.nextChangeOf.set(guardId, nextChange);

            return propagateTaskChange(
                exerciseState,
                technicalChallengeId,
                stateMachine,
                index,
                transitionId,
                parentId,
                previousNextChange,
                nextChange
            );
        }
        case 'andGuard': {
            if (
                childPreviousNextChange === undefined ||
                childNextChange === undefined
            ) {
                throw new Error(
                    'propagateTaskChange called on an AND-node with no propagating child.'
                );
            }
            const currentNextChange = index.nextChangeOf.get(guardId)!;
            if (currentNextChange.currentValue) {
                if (
                    childPreviousNextChange.changeTimestamp >
                    currentNextChange.changeTimestamp
                ) {
                    if (
                        childNextChange.changeTimestamp <
                        currentNextChange.changeTimestamp
                    ) {
                        const newNextChange: NextChange = {
                            currentValue: true,
                            nextValue: false,
                            changeTimestamp: childNextChange.changeTimestamp,
                        };
                        index.nextChangeOf.set(guardId, newNextChange);
                        return propagateTaskChange(
                            exerciseState,
                            technicalChallengeId,
                            stateMachine,
                            index,
                            transitionId,
                            parentId,
                            currentNextChange,
                            newNextChange
                        );
                    }
                    // TODO: Terminate
                    return null;
                }
                if (
                    childPreviousNextChange.changeTimestamp ===
                    currentNextChange.changeTimestamp
                ) {
                    if (
                        childNextChange.changeTimestamp ===
                        currentNextChange.changeTimestamp
                    )
                        return null;

                    if (
                        childNextChange.changeTimestamp <
                        currentNextChange.changeTimestamp
                    ) {
                        // TODO: Propagate (earliest turning false is now earlier)
                        const newNextChange: NextChange = {
                            currentValue: true,
                            nextValue: false,
                            changeTimestamp: childNextChange.changeTimestamp,
                        };
                        index.nextChangeOf.set(guardId, newNextChange);
                        return propagateTaskChange(
                            exerciseState,
                            technicalChallengeId,
                            stateMachine,
                            index,
                            transitionId,
                            parentId,
                            currentNextChange,
                            newNextChange
                        );
                    } else if (
                        childNextChange.changeTimestamp >
                        currentNextChange.changeTimestamp
                    ) {
                        // TODO: Rescan children, propagate if result !== currentNextChange.changeTimestamp
                        const newNextChangeTimestamp = Math.min(
                            ...guard.guards.map(
                                (g) =>
                                    index.nextChangeOf.get(g.id)!
                                        .changeTimestamp
                            )
                        );
                        if (
                            newNextChangeTimestamp ===
                            currentNextChange.changeTimestamp
                        )
                            return null;
                        const newNextChange: NextChange = {
                            currentValue: true,
                            nextValue: false,
                            changeTimestamp: newNextChangeTimestamp,
                        };
                        index.nextChangeOf.set(guard.id, newNextChange);
                        return propagateTaskChange(
                            exerciseState,
                            technicalChallengeId,
                            stateMachine,
                            index,
                            transitionId,
                            parentId,
                            currentNextChange,
                            newNextChange
                        );
                    }
                }
            } else {
                let L = currentNextChange.latestTrue;
                let F = currentNextChange.earliestFalse;

                if (L === undefined || F == undefined)
                    throw new Error(
                        'latestTrue and earliestFalse should be seeded'
                    );

                const childInL =
                    !childNextChange.currentValue && childNextChange.nextValue;
                if (childInL) {
                    L = updateMax(
                        L,
                        childPreviousNextChange.changeTimestamp,
                        childNextChange.changeTimestamp,
                        () =>
                            Math.max(
                                ...guard.guards
                                    .map((g) => index.nextChangeOf.get(g.id))
                                    .filter(
                                        (g) =>
                                            g !== undefined &&
                                            !g.currentValue &&
                                            g.nextValue
                                    )
                                    .map((g) => g!.changeTimestamp)
                            )
                    );
                }

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
                const childWasInF = childPreviousNextChange.nextValue === false;
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
                const childIsInF = childNextChange.nextValue === false;

                if (childWasInF && childIsInF) {
                    F = updateMin(
                        F,
                        childPreviousNextChange.changeTimestamp,
                        childNextChange.changeTimestamp,
                        () =>
                            Math.min(
                                ...guard.guards
                                    .map((g) => index.nextChangeOf.get(g.id))
                                    .filter(
                                        (g) => g !== undefined && !g.nextValue
                                    )
                                    .map((g) => g!.changeTimestamp)
                            )
                    );
                } else if (childIsInF) {
                    F = Math.min(F, childNextChange.changeTimestamp);
                } else if (childWasInF) {
                    if (childPreviousNextChange.changeTimestamp <= F) {
                        F = Math.min(
                            ...guard.guards
                                .map((g) => index.nextChangeOf.get(g.id))
                                .filter((g) => g !== undefined && !g.nextValue)
                                .map((g) => g!.changeTimestamp)
                        );
                    }
                }

                const newNextValue = L < F;
                const newT = newNextValue ? L : F;

                const newNextChange: NextChange = {
                    currentValue: false,
                    nextValue: newNextValue,
                    changeTimestamp: newT,
                    latestTrue: L,
                    earliestFalse: F,
                };
                index.nextChangeOf.set(guardId, newNextChange);

                if (
                    newT === currentNextChange.changeTimestamp &&
                    newNextValue === currentNextChange.nextValue
                )
                    return null;

                return propagateTaskChange(
                    exerciseState,
                    technicalChallengeId,
                    stateMachine,
                    index,
                    transitionId,
                    parentId,
                    currentNextChange,
                    newNextChange
                );
            }
            break;
        }
        case 'timerGuard':
            throw new Error('This should be unreachable.');
    }
    return null;
}

function calculateGuardNextChange(
    stateMachine: WritableDraft<StateMachine>,
    exerciseState: WritableDraft<ExerciseState>,
    index: GuardIndex,
    guard: Guard,
    setNextChange: boolean = false
): NextChange {
    switch (guard.type) {
        case 'notGuard': {
            const subGuard = calculateGuardNextChange(
                stateMachine,
                exerciseState,
                index,
                guard.guard,
                setNextChange
            );
            console.log(
                `[guardTs:not]\n\tchild.current=${subGuard.currentValue}\n\tchild.nextChange=${subGuard.changeTimestamp}\n\t→ current=${!subGuard.currentValue}`
            );
            const nextChange: NextChange = {
                currentValue: !subGuard.currentValue,
                nextValue: !!subGuard.currentValue,
                changeTimestamp: subGuard.changeTimestamp,
            };
            if (setNextChange) {
                index.nextChangeOf.set(guard.id, nextChange);
            }
            return nextChange;
        }
        case 'andGuard': {
            const subGuards = guard.guards.map((g) =>
                calculateGuardNextChange(
                    stateMachine,
                    exerciseState,
                    index,
                    g,
                    setNextChange
                )
            );
            const currentValue = subGuards.reduce(
                (v, g) => v && g.currentValue,
                true
            );

            console.log(
                `[guardTs:and]\n\tchildren=[${subGuards.map((g) => `{cur:${g.currentValue},nc:${g.changeTimestamp}}`).join(',')}]\n\tallFulfilled=${currentValue}`
            );

            const latestTrue = Math.max(
                ...subGuards
                    .filter((g) => !g.currentValue && g.nextValue)
                    .map((g) => g.changeTimestamp)
            );

            const earliestFalse = Math.min(
                ...subGuards
                    .filter((g) => !g.nextValue)
                    .map((g) => g.changeTimestamp)
            );

            if (currentValue) {
                console.log(`\n\tWill turn false at ${earliestFalse}`);
                const nextChange = {
                    currentValue,
                    nextValue: false,
                    changeTimestamp: earliestFalse,
                    latestTrue,
                    earliestFalse,
                };
                if (setNextChange) {
                    index.nextChangeOf.set(guard.id, nextChange);
                }
                return nextChange;
            }

            if (latestTrue < earliestFalse) {
                console.log(`\n\tWill turn true at ${latestTrue}`);
                const nextChange = {
                    currentValue: false,
                    nextValue: true,
                    changeTimestamp: latestTrue,
                    latestTrue,
                    earliestFalse,
                };
                if (setNextChange) {
                    index.nextChangeOf.set(guard.id, nextChange);
                }
                return nextChange;
            }

            console.log(
                `\n\tOne subGard will turn false at t=${earliestFalse}, which is earlier than t=${latestTrue} where the last will turn true`
            );

            const nextChange = {
                currentValue: false,
                nextValue: false,
                changeTimestamp: earliestFalse,
                latestTrue,
                earliestFalse,
            };
            if (setNextChange) {
                index.nextChangeOf.set(guard.id, nextChange);
            }
            return nextChange;
        }
        case 'taskGuard': {
            if (
                isTaskGuardFulfilled(
                    guard,
                    stateMachine,
                    exerciseState.currentTime
                )
            ) {
                console.log(
                    `[guardTs:task]\n\ttaskId=${guard.taskId}\n\tprogress=>=100%\n\tFULFILLED → nextChange=Infinity`
                );
                const nextChange = {
                    currentValue: true,
                    nextValue: true,
                    changeTimestamp: Infinity,
                };
                if (setNextChange) {
                    index.nextChangeOf.set(guard.id, nextChange);
                }
                return nextChange;
            }

            const taskProgress = getTaskProgress(
                guard.taskId,
                stateMachine,
                exerciseState.currentTime
            );

            const totalDuration =
                stateMachine.tasks[guard.taskId]!.totalDuration;
            const remainingDuration =
                guard.minProgress * totalDuration - taskProgress.timeSpent;
            const nextChangeTimestamp =
                exerciseState.currentTime +
                remainingDuration / taskProgress.rate;

            console.log(
                `[guardTs:task]\n\ttaskId=${guard.taskId}\n\tprogress=${(taskProgress.progressPercentage * 100).toFixed(2)}%\n\trate=${taskProgress.rate}\n\tremaining=${remainingDuration.toFixed(3)}\n\tnextChange=${nextChangeTimestamp}`
            );
            const nextChange = {
                currentValue: false,
                nextValue: true,
                changeTimestamp: nextChangeTimestamp,
            };
            if (setNextChange) {
                index.nextChangeOf.set(guard.id, nextChange);
            }
            return nextChange;
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
                const nextChange = {
                    currentValue: true,
                    nextValue: true,
                    changeTimestamp: Infinity,
                };
                if (setNextChange) {
                    index.nextChangeOf.set(guard.id, nextChange);
                }
                return nextChange;
            }

            const timer = stateMachine.timers[guard.timerId]!;
            const nextChangeTimestamp =
                stateMachine.simulationStartTime +
                guard.minProgress * timer.totalDuration;

            console.log(
                `[guardTs:timer]\n\ttimerId=${guard.timerId}\n\tsimulationStartTime=${stateMachine.simulationStartTime}\n\tminProgress=${guard.minProgress}\n\ttotalDuration=${timer.totalDuration}\n\tnextChange=${nextChangeTimestamp}`
            );
            const nextChange = {
                currentValue: false,
                nextValue: true,
                changeTimestamp: nextChangeTimestamp,
            };
            if (setNextChange) {
                index.nextChangeOf.set(guard.id, nextChange);
            }
            return nextChange;
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
    // TODO: this currently ignores all non-affected transitions. If the only affected transition is now Infinity due to no personnel assigned, the correct non-affected event is not added
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

    console.log(
        `[updateQueueTask:update]\n\tsmId=${stateMachine.id}\n\ttransitionId: ${current.transitionId}→${newEvent.transitionId}\n\tt: ${current.timestamp}→${newEvent.timestamp}`
    );
    modify(queue, stateMachine.id, newEvent);
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

    if (!nextTransition) {
        console.log(
            `[simulate:error] simulateStateMachine called with invalid transitionId ${transitionId}`
        );
        return;
    }

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
