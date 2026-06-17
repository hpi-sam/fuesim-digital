import { z } from 'zod';
import type { WritableDraft } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import type { ExerciseState } from '../../state.js';
import { taskSchema } from '../task.js';
import {
    type ImageProperties,
    imagePropertiesSchema,
} from '../utils/image-properties.js';
import { getElement } from '../../store/action-reducers/utils/get-element.js';
import {
    newUserGeneratedContent,
    type UserGeneratedContent,
    userGeneratedContentSchema,
} from '../user-generated-content.js';
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
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import type { TechnicalChallengeEvent } from './event.js';
import { newTechnicalChallengeEvent } from './event.js';

export const technicalChallengeStateIdSchema = uuidSchema.brand(
    'TechnicalChallengeStateId'
);
export type TechnicalChallengeStateId = z.infer<
    typeof technicalChallengeStateIdSchema
>;

export const technicalChallengeStateSchema = z.object({
    id: technicalChallengeStateIdSchema,
    title: z.string(),
    image: imagePropertiesSchema,
    userGeneratedContent: userGeneratedContentSchema,
    viewedByParticipants: z.boolean().optional(),
    /**
     * maps taskId to the task-specific progress multiplier (default 1)
     * */
    possibleTasks: z.record(taskSchema.shape.id, z.number()),
});
export type TechnicalChallengeState = z.infer<
    typeof technicalChallengeStateSchema
>;

export function newTechnicalChallengeState(
    title: string,
    image: ImageProperties,
    possibleTasks: UUID[] | { [key: UUID]: number } = {},
    userGeneratedContent?: UserGeneratedContent
): TechnicalChallengeState {
    if (possibleTasks instanceof Array) {
        // eslint-disable-next-line no-param-reassign
        possibleTasks = Object.fromEntries(possibleTasks.map((id) => [id, 1]));
    }
    return {
        id: uuid() as TechnicalChallengeStateId,
        title,
        image,
        userGeneratedContent: userGeneratedContent ?? newUserGeneratedContent(),
        possibleTasks,
    };
}

const progressGuardSchema = z.object({
    type: z.literal('progressGuard'),
    minProgress: z.number().optional(),
    maxProgress: z.number().optional(),
    taskId: uuidSchema,
    name: z.string().optional(),
});
export type ProgressGuard = z.infer<typeof progressGuardSchema>;

const timerGuardSchema = z.object({
    type: z.literal('timerGuard'),
    /** Time in exercise time */
    minTimePassed: z.number().nonnegative(),
    name: z.string().optional(),
});
export type TimerGuard = z.infer<typeof timerGuardSchema>;

function isProgressGuardFulfilled(
    progressGuard: ProgressGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    const challenge = getElement(
        exerciseState,
        'technicalChallenge',
        technicalChallengeId
    );
    const progress =
        challenge.taskProgress[progressGuard.taskId]?.progress ?? 0;
    return (
        progress < (progressGuard.maxProgress ?? Number.MAX_VALUE) &&
        progress >= (progressGuard.minProgress ?? 0)
    );
}

function isTimerGuardFulfilled(
    timerGuard: TimerGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    const challenge = getElement(
        exerciseState,
        'technicalChallenge',
        technicalChallengeId
    );
    const relativeTime =
        exerciseState.currentTime - challenge.simulationStartTime;
    return relativeTime >= timerGuard.minTimePassed;
}

export const guardSchema = z.union([progressGuardSchema, timerGuardSchema]);
export type Guard = ProgressGuard | TimerGuard;

export const transitionSchema = z.object({
    id: uuidSchema,
    to: technicalChallengeStateIdSchema,
    from: technicalChallengeStateIdSchema,
    guard: guardSchema,
});

export type Transition = z.infer<typeof transitionSchema>;

export function isGuardFulfilled(
    guard: Guard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean {
    switch (guard.type) {
        case 'progressGuard':
            return isProgressGuardFulfilled(
                guard,
                technicalChallengeId,
                exerciseState
            );
        case 'timerGuard':
            return isTimerGuardFulfilled(
                guard,
                technicalChallengeId,
                exerciseState
            );
    }
}

export const stateMachineSchema = z.strictObject({
    states: z.record(
        technicalChallengeStateSchema.shape.id,
        technicalChallengeStateSchema
    ),
    relevantTasks: z.record(taskSchema.shape.id, taskSchema),
    transitions: z.record(transitionSchema.shape.id, transitionSchema),
    simulationStartTime: z.number(),
});

export function currentStateOf(
    technicalChallenge: TechnicalChallenge
): TechnicalChallengeState {
    const state = technicalChallenge.states[technicalChallenge.currentStateId];
    console.assert(
        !!state,
        `Invalid current state: ${technicalChallenge.currentStateId} for challenge ${technicalChallenge.id}`
    );
    return state!;
}

export function currentlyPossibleTaskIds(
    technicalChallenge: TechnicalChallenge
): UUID[] {
    const currentState = currentStateOf(technicalChallenge);

    return Object.keys(currentState.possibleTasks);
}

function unassignFromNonexistentTasks(
    technicalChallenge: WritableDraft<TechnicalChallenge>
) {
    const unassignedPersonnel: { taskId: UUID; personnelId: UUID }[] = [];
    for (const [personnelId, taskId] of Object.entries(
        technicalChallenge.assignedPersonnel
    )) {
        if (!currentlyPossibleTaskIds(technicalChallenge).includes(taskId)) {
            delete technicalChallenge.assignedPersonnel[personnelId];
            unassignedPersonnel.push({ taskId, personnelId });
        }
    }
    return unassignedPersonnel;
}

export function updateTaskProgress(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    taskId: UUID,
    state: TechnicalChallengeState | null = null
) {
    // eslint-disable-next-line no-param-reassign
    state ??= currentStateOf(technicalChallenge);

    if (!state.possibleTasks[taskId]) return;

    const taskProgress = technicalChallenge.taskProgress[taskId];

    if (!taskProgress) {
        technicalChallenge.taskProgress[taskId] = {
            progress: 0,
            lastUpdatedAt: exerciseState.currentTime,
        };
        return;
    }

    const nAssignedPersonnel = Object.values(
        technicalChallenge.assignedPersonnel
    ).filter((_taskId) => _taskId === taskId).length;

    taskProgress.progress =
        taskProgress.progress +
        (exerciseState.currentTime - taskProgress.lastUpdatedAt) *
            nAssignedPersonnel *
            state.possibleTasks[taskId];
    taskProgress.lastUpdatedAt = exerciseState.currentTime;
}

export function updateAllTasksProgress(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>
) {
    const state = currentStateOf(technicalChallenge);

    for (const taskId of Object.keys(state.possibleTasks))
        updateTaskProgress(exerciseState, technicalChallenge, taskId);
}

function computeEarliestEvent(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    transitions: Transition[]
): TechnicalChallengeEvent | null {
    const state = currentStateOf(technicalChallenge);
    let earliestTimestamp = Infinity;
    let earliestEvent: TechnicalChallengeEvent | null = null;

    for (const transition of transitions) {
        const guard = transition.guard;
        let eventTimestamp = Infinity;

        switch (guard.type) {
            case 'progressGuard': {
                const nAssignedPersonnel = Object.values(
                    technicalChallenge.assignedPersonnel
                ).filter((taskId) => taskId === guard.taskId).length;

                if (nAssignedPersonnel === 0) continue;

                const taskProgress =
                    technicalChallenge.taskProgress[guard.taskId]!;
                eventTimestamp =
                    exerciseState.currentTime +
                    ((guard.minProgress ?? 0) - taskProgress.progress) /
                        (nAssignedPersonnel *
                            state.possibleTasks[guard.taskId]!);
                break;
            }
            case 'timerGuard': {
                eventTimestamp =
                    technicalChallenge.simulationStartTime +
                    guard.minTimePassed;
                break;
            }
        }

        if (eventTimestamp >= earliestTimestamp) continue;
        earliestTimestamp = eventTimestamp;
        earliestEvent = newTechnicalChallengeEvent(
            eventTimestamp,
            technicalChallenge.id,
            transition.id
        );
    }

    return earliestEvent;
}

function applyEventToQueue(
    exerciseState: WritableDraft<ExerciseState>,
    challengeId: TechnicalChallengeId,
    earliestEvent: TechnicalChallengeEvent | null
): void {
    const queue = exerciseState.technicalChallengeEventQueue;

    if (earliestEvent === null) {
        remove(queue, challengeId);
        return;
    }
    if (queue.indices[challengeId] === undefined) {
        insert(queue, earliestEvent);
        return;
    }
    const current = queue.events[queue.indices[challengeId]]!;
    if (
        current.transitionId === earliestEvent.transitionId &&
        current.timestamp === earliestEvent.timestamp
    )
        return;
    modify(queue, challengeId, earliestEvent);
}

/** Full recomputation across all transitions — use after state transitions and on initial creation. */
export function updateEventQueue(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>
): void {
    const potentialTransitions = Object.values(
        technicalChallenge.transitions
    ).filter((t) => t.from === technicalChallenge.currentStateId);

    if (potentialTransitions.length === 0) {
        remove(
            exerciseState.technicalChallengeEventQueue,
            technicalChallenge.id
        );
        return;
    }

    const earliestEvent = computeEarliestEvent(
        exerciseState,
        technicalChallenge,
        potentialTransitions
    );
    applyEventToQueue(exerciseState, technicalChallenge.id, earliestEvent);
}

/**
 * Targeted update after a personnel is assigned to taskId.
 * Only recomputes transitions for taskId; only updates the queue if the new
 * event fires earlier than the current one.
 */
export function updateEventQueueAfterAssignment(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    taskId: UUID
): void {
    const affectedTransitions = Object.values(
        technicalChallenge.transitions
    ).filter(
        (t) =>
            t.from === technicalChallenge.currentStateId &&
            t.guard.type === 'progressGuard' &&
            t.guard.taskId === taskId
    );

    if (affectedTransitions.length === 0) return;

    const newEvent = computeEarliestEvent(
        exerciseState,
        technicalChallenge,
        affectedTransitions
    );
    if (newEvent === null) return;

    const queue = exerciseState.technicalChallengeEventQueue;
    if (queue.indices[technicalChallenge.id] === undefined) {
        insert(queue, newEvent);
        return;
    }
    const current = queue.events[queue.indices[technicalChallenge.id]!]!;
    if (newEvent.timestamp < current.timestamp) {
        modify(queue, technicalChallenge.id, newEvent);
    }
}

/**
 * Targeted update after a personnel is removed from taskId.
 * If the current queue event is not for taskId, no recomputation is needed
 * (non-affected transitions are unchanged, and affected ones only got slower).
 * If it is for taskId, falls back to a full recomputation.
 */
export function updateEventQueueAfterUnassignment(
    exerciseState: WritableDraft<ExerciseState>,
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    taskId: UUID
): void {
    const queue = exerciseState.technicalChallengeEventQueue;
    const idx = queue.indices[technicalChallenge.id];
    if (idx === undefined) return;

    const currentTransition =
        technicalChallenge.transitions[queue.events[idx]!.transitionId];
    if (
        currentTransition?.guard.type !== 'progressGuard' ||
        currentTransition.guard.taskId !== taskId
    )
        return;

    updateEventQueue(exerciseState, technicalChallenge);
}

export function simulateTechnicalChallenge(
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    transitionId: WritableDraft<UUID>,
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    // const state = currentStateOf(technicalChallenge);
    // for (const taskId of Object.values(technicalChallenge.assignedPersonnel)) {
    //     if (state.possibleTasks[taskId]) {
    //         technicalChallenge.taskProgress[taskId] ??= newTaskProgress();
    //         technicalChallenge.taskProgress[taskId].progress +=
    //             tickInterval * state.possibleTasks[taskId];
    //         technicalChallenge.taskProgress[taskId].lastUpdatedAt =
    //             exerciseState.currentTime;
    //     }
    // }

    // const fromCurrentState = (t: Transition) =>
    //     t.from === technicalChallenge.currentStateId;
    // const guardFulfilled = (t: Transition) =>
    //     isGuardFulfilled(t.guard, technicalChallenge.id, exerciseState);

    // // the next transition is not necessarily the first one to have its guard
    // // fulfilled
    // const nextTransition = Object.values(technicalChallenge.transitions)
    //     .filter(fromCurrentState)
    //     .find(guardFulfilled);

    // if (!nextTransition) return;

    const nextTransition = technicalChallenge.transitions[transitionId];

    if (!nextTransition) return;

    logTechnicalChallengeStateTransition(
        exerciseState,
        technicalChallenge.id,
        technicalChallenge.currentStateId,
        nextTransition.to
    );

    updateAllTasksProgress(exerciseState, technicalChallenge);

    technicalChallenge.currentStateId = nextTransition.to;

    const unassignedPersonnel =
        unassignFromNonexistentTasks(technicalChallenge);
    if (unassignedPersonnel.length > 0) {
        for (const { personnelId, taskId } of unassignedPersonnel) {
            logTechnicalChallengePersonnelUnassigned(
                exerciseState,
                technicalChallenge.id,
                personnelId,
                taskId
            );
        }
    }

    updateEventQueue(exerciseState, technicalChallenge);
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const queue = draftState.technicalChallengeEventQueue;
    while ((peek(queue)?.timestamp ?? Infinity) <= draftState.currentTime) {
        const event = pop(queue)!;
        simulateTechnicalChallenge(
            draftState.technicalChallenges[event.technicalChallengeId]!,
            event.transitionId,
            draftState,
            tickInterval
        );
    }
}
