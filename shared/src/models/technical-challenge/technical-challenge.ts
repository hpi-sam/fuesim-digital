import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuidSchema } from '../../utils/uuid.js';
import { imagePropertiesSchema } from '../utils/image-properties.js';
import { positionSchema } from '../utils/position/position.js';
import { sizeSchema } from '../utils/size.js';
import { stateMachineSchema } from './state-machine.js';

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
    size: sizeSchema,
    ...stateMachineSchema.shape,
});

export type TechnicalChallenge = Immutable<
    z.infer<typeof technicalChallengeSchema>
>;
