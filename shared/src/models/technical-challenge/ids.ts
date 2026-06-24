import type { z } from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

export const stateMachineIdSchema = uuidSchema.brand('StateMachineId');

export type StateMachineId = z.infer<typeof stateMachineIdSchema>;

export const technicalChallengeIdSchema = uuidSchema.brand(
    'TechnicalChallengeId'
);
export type TechnicalChallengeId = z.infer<typeof technicalChallengeIdSchema>;
