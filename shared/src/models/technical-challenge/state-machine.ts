import { z } from 'zod';
import type { WritableDraft } from 'immer';
import type { UUID } from '../../utils/index.js';
import { uuid, uuidSchema } from '../../utils/index.js';
import type { ExerciseState } from '../../state.js';
import { taskSchema } from '../task.js';
import type { ImageProperties } from '../utils/index.js';
import { imagePropertiesSchema } from '../utils/index.js';
import type {
    TechnicalChallenge,
    TechnicalChallengeId,
} from './technical-challenge.js';

export const technicalChallengeStateIdSchema = uuidSchema.brand(
    'TechnicalChallengeStateId'
);
export type TechnicalChallengeStateId = z.infer<
    typeof technicalChallengeStateIdSchema
>;

export const technicalChallengeStateSchema = z.object({
    id: technicalChallengeStateIdSchema,
    title: z.string(),
    mapImage: imagePropertiesSchema,
    possibleTasks: z.record(taskSchema.shape.id, z.number()),
});
export type TechnicalChallengeState = z.infer<
    typeof technicalChallengeStateSchema
>;

export function createTechnicalChallengeState(
    title: string,
    mapImage: ImageProperties,
    possibleTasks: { [key: UUID]: number } = {}
): TechnicalChallengeState {
    return {
        id: uuid() as TechnicalChallengeStateId,
        title,
        mapImage,
        possibleTasks: {},
    };
}

const progressGuardSchema = z.object({
    type: z.literal('ProgressGuard'),
    minProgress: z.number().optional(),
    maxProgress: z.number().optional(),
    taskId: uuidSchema,
    name: z.string().optional(),
});
export type ProgressGuard = z.infer<typeof progressGuardSchema>;

const timerGuardSchema = z.object({
    type: z.literal('TimerGuard'),
    /** Time in exercise time */
    minTimePassed: z.number().nonnegative(),
    name: z.string().optional(),
});
export type TimerGuard = z.infer<typeof timerGuardSchema>;

const isProgressGuardFulfilled = (
    progressGuard: ProgressGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean => {
    const challenge = exerciseState.technicalChallenges[technicalChallengeId];
    console.assert(
        challenge,
        `TechnicalChallenge ${technicalChallengeId} not found.`
    );
    const progress = challenge?.taskProgress[progressGuard.taskId] ?? 0;
    return (
        progress < (progressGuard.maxProgress ?? Number.MAX_VALUE) &&
        progress > (progressGuard.minProgress ?? 0)
    );
};

const isTimerGuardFulfilled = (
    timerGuard: TimerGuard,
    exerciseState: ExerciseState
): boolean => exerciseState.currentTime >= timerGuard.minTimePassed;

export const guardSchema = z.union([progressGuardSchema, timerGuardSchema]);
export type Guard = ProgressGuard | TimerGuard;

export const transitionSchema = z.object({
    to: technicalChallengeStateIdSchema,
    from: technicalChallengeStateIdSchema,
    guard: guardSchema,
});

export type Transition = z.infer<typeof transitionSchema>;

export const isGuardFulfilled = (
    guard: Guard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
): boolean => {
    switch (guard.type) {
        case 'ProgressGuard':
            return isProgressGuardFulfilled(
                guard,
                technicalChallengeId,
                exerciseState
            );
        case 'TimerGuard':
            return isTimerGuardFulfilled(guard, exerciseState);
    }
};

export const stateMachineSchema = z.strictObject({
    states: z.array(technicalChallengeStateSchema),
    relevantTasks: z.array(taskSchema),
    transitions: z.array(transitionSchema),
});

const getStateOf = (
    technicalChallenge: TechnicalChallenge,
    stateId: TechnicalChallengeStateId
): TechnicalChallengeState | undefined =>
    technicalChallenge.states.find((state) => state.id === stateId);
export const currentStateOf = (
    technicalChallenge: TechnicalChallenge
): TechnicalChallengeState =>
    getStateOf(technicalChallenge, technicalChallenge.currentStateId)!;

export const simulateTechnicalChallenge = (
    technicalChallenge: TechnicalChallenge,
    exerciseState: WritableDraft<ExerciseState>,
    tickInterval: number
) => {
    const state = currentStateOf(technicalChallenge);
    for (const taskId of Object.values(technicalChallenge.assignedPersonnel)) {
        if (state.possibleTasks[taskId]) {
            technicalChallenge.taskProgress[taskId] ??= 0;
            technicalChallenge.taskProgress[taskId] +=
                tickInterval * state.possibleTasks[taskId];
        }

        // TODO: think about what happens when the tick interval is > 1000
    }

    const fromCurrentState = (t: Transition) =>
        t.from === technicalChallenge.currentStateId;
    const guardFulfilled = (t: Transition) =>
        isGuardFulfilled(t.guard, technicalChallenge.id, exerciseState);

    const nextTransition = technicalChallenge.transitions
        .filter(fromCurrentState)
        .find(guardFulfilled);

    if (!nextTransition) return;

    technicalChallenge.currentStateId = nextTransition.to;
};

export const simulateAllTechnicalChallenges = (
    draftState: WritableDraft<ExerciseState>,
    tickInterval: number
) => {
    Object.values(draftState.technicalChallenges).forEach((challenge) =>
        simulateTechnicalChallenge(challenge, draftState, tickInterval)
    );
};
