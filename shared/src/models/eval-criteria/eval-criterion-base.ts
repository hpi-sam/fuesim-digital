import * as z from 'zod';
import { uuidSchema } from '../../utils/uuid.js';

export const evalCriterionBaseSchema = z.strictObject({
    id: uuidSchema,
    name: z.string(),
    type: z.literal('evalCriterion'),
    isVisibleForParticipants: z.boolean(),
    isDraft: z.boolean(),
});
export const boolEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
});

export const numberEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
});
