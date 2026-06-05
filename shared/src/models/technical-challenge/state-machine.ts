import { z } from 'zod';
import type { WritableDraft } from 'immer';
import { uuid, uuidSchema, type UUID } from '../../utils/uuid.js';
import type { ExerciseState } from '../../state.js';
import { newTaskProgress, taskSchema } from '../task.js';
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
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import { insert, peek, pop } from '../../state-helpers/events.js';
import {
    newTechnicalChallengeEvent,
    newTechnicalChallengeEventQueue,
} from './event.js';

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

export function updateEventQueue(
    technicalChallenge: WritableDraft<TechnicalChallenge>,
    exerciseState: WritableDraft<ExerciseState>
) {
    const state = currentStateOf(technicalChallenge);

    const fromCurrentState = (t: Transition) =>
        t.from === technicalChallenge.currentStateId;

    const potentialTransitions = Object.values(
        technicalChallenge.transitions
    ).filter(fromCurrentState);

    const queue = exerciseState.technicalChallengeEventQueue;
    for (const transition of potentialTransitions) {
        const guard = transition.guard;
        const event = newTechnicalChallengeEvent(
            0,
            technicalChallenge.id,
            transition.id
        );
        switch (guard.type) {
            case 'progressGuard': {
                const nAssignedPersonnel = Object.values(
                    technicalChallenge.assignedPersonnel
                ).filter((taskId) => taskId === guard.taskId).length;

                if (nAssignedPersonnel === 0) continue;

                const taskProgress =
                    technicalChallenge.taskProgress[guard.taskId]!;
                event.timestamp =
                    ((guard.minProgress ?? 0) - taskProgress.progress) /
                    (nAssignedPersonnel * state.possibleTasks[guard.taskId]!);
                break;
            }
            case 'timerGuard': {
                event.timestamp =
                    technicalChallenge.simulationStartTime +
                    guard.minTimePassed;
                break;
            }
        }
        insert(queue, event);
    }
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

    updateEventQueue(technicalChallenge, exerciseState);
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const queue = draftState.technicalChallengeEventQueue;
    console.log(JSON.stringify(queue, null, 2));
    console.log(
        `Comparing ${peek(queue)?.timestamp} with ${draftState.currentTime}`
    );
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
