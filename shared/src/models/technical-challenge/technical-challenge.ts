import { z } from 'zod';
import { uuidSchema } from '../../utils/index.js';
import { positionSchema, imagePropertiesSchema } from '../utils/index.js';
import {
    stateMachineSchema,
    technicalChallengeStateIdSchema,
} from './state-machine.js';

export const technicalChallengeIdSchema = uuidSchema.brand(
    'TechnicalChallengeId'
);
export type TechnicalChallengeId = z.infer<typeof technicalChallengeIdSchema>;

export const technicalChallengeSchema = z.strictObject({
    id: technicalChallengeIdSchema,
    type: z.literal('technicalChallenge'),
    name: z.string(),
    templateId: uuidSchema,
    image: imagePropertiesSchema,
    position: positionSchema,
    taskProgress: z.record(z.uuidv4(), z.number()),
    currentStateId: technicalChallengeStateIdSchema,
    ...stateMachineSchema.shape,
});

export type TechnicalChallenge = z.infer<typeof technicalChallengeSchema>;
