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
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';
import {
    UserGeneratedContentId,
    userGeneratedContentIdSchema,
} from '../user-generated-content.js';

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
    userGeneratedContentId: userGeneratedContentIdSchema,
    possibleTasks: z.record(taskSchema.shape.id, z.number()),
});
export type TechnicalChallengeState = z.infer<
    typeof technicalChallengeStateSchema
>;

export function newTechnicalChallengeState(
    title: string,
    image: ImageProperties,
    possibleTasks: UUID[] | { [key: UUID]: number } = {},
    userGeneratedContentId?: UserGeneratedContentId
): TechnicalChallengeState {
    if (possibleTasks instanceof Array) {
        // eslint-disable-next-line no-param-reassign
        possibleTasks = Object.fromEntries(possibleTasks.map((id) => [id, 1]));
    }
    return {
        id: uuid() as TechnicalChallengeStateId,
        title,
        image,
        userGeneratedContentId:
            userGeneratedContentId ?? (uuid() as UserGeneratedContentId),
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
    const progress = challenge.taskProgress[progressGuard.taskId] ?? 0;
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
    transitions: z.array(transitionSchema),
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

export function simulateTechnicalChallenge(
    technicalChallenge: TechnicalChallenge,
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    const state = currentStateOf(technicalChallenge);
    for (const taskId of Object.values(technicalChallenge.assignedPersonnel)) {
        if (state.possibleTasks[taskId]) {
            technicalChallenge.taskProgress[taskId] ??= 0;
            technicalChallenge.taskProgress[taskId] +=
                tickInterval * state.possibleTasks[taskId];
        }
    }

    const fromCurrentState = (t: Transition) =>
        t.from === technicalChallenge.currentStateId;
    const guardFulfilled = (t: Transition) =>
        isGuardFulfilled(t.guard, technicalChallenge.id, exerciseState);

    // the next transition is not necessarily the first one to have its guard
    // fulfilled
    const nextTransition = technicalChallenge.transitions
        .filter(fromCurrentState)
        .find(guardFulfilled);

    if (!nextTransition) return;

    technicalChallenge.currentStateId = nextTransition.to;
}

export function simulateAllTechnicalChallenges(
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) {
    Object.values(draftState.technicalChallenges).forEach((challenge) =>
        simulateTechnicalChallenge(challenge, draftState, tickInterval)
    );
}
