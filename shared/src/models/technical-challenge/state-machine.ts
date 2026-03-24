import { z } from 'zod';
import type { WritableDraft } from 'immer';
import { uuid, uuidSchema } from '../../utils/index.js';
import type { ExerciseState } from '../../state.js';
import { taskSchema } from '../task.js';
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
});
export type TechnicalChallengeState = z.infer<
    typeof technicalChallengeStateSchema
>;

export function createTechnicalChallengeState(
    title: string
): TechnicalChallengeState {
    return {
        id: uuid() as TechnicalChallengeStateId,
        title,
    };
}

export const progressGuardSchema = z.object({
    type: z.literal('ProgressGuard'),
    minProgress: z.number().optional(),
    maxProgress: z.number().optional(),
    taskId: uuidSchema,
});
export type ProgressGuard = z.infer<typeof progressGuardSchema>;

const isProgressGuardFulfilled = (
    progressGuard: ProgressGuard,
    technicalChallengeId: TechnicalChallengeId,
    exerciseState: ExerciseState
) => {
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

export const guardSchema = z.union([progressGuardSchema]);
export type Guard = ProgressGuard;

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
    }
    throw TypeError(`Unknown guard type: ${guard.type}`, { cause: guard });
};

export const stateMachineSchema = z.strictObject({
    states: z.array(technicalChallengeStateSchema),
    relevantTasks: z.array(taskSchema),
    transitions: z.array(transitionSchema),
});

export const simulateTechnicalChallenge = (
    technicalChallenge: TechnicalChallenge,
    exerciseState: WritableDraft<ExerciseState>
) => {
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

export const tickAllTechnicalChallenges = (
    draftState: WritableDraft<ExerciseState>
) => {
    Object.values(draftState.technicalChallenges).forEach((challenge) =>
        simulateTechnicalChallenge(challenge, draftState)
    );
};
