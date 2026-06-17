import type { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

export const stateMachineIdSchema = uuidSchema.brand('StateMachineId');

export type StateMachineId = z.infer<typeof stateMachineIdSchema>;

export const technicalChallengeIdSchema = uuidSchema.brand(
    'TechnicalChallengeId'
);
export type TechnicalChallengeId = z.infer<typeof technicalChallengeIdSchema>;

export const transitionIdSchema = uuidSchema.brand<'TransitionId'>();
export type TransitionId = z.infer<typeof transitionIdSchema>;

export const guardIdSchema = uuidSchema.brand<'GuardId'>();
export type GuardId = z.infer<typeof guardIdSchema>;
