import z from 'zod';
import {
    EvalCriterionId,
    numberEvalCriterionBaseSchema,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const timestampEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('timestampEvalCriterion'),
    timestamp: z.number(),
});
export type timestampEvalCriterion = z.infer<
    typeof timestampEvalCriterionSchema
>;
export function newtimestampEvalCriterion(
    name: string,
    timestamp: number,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): timestampEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'timestampEvalCriterion',
        timestamp,
    };
}
