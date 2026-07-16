import z from 'zod';
import {
    BoolEvalCriterionId,
    boolEvalCriterionIdSchema,
    EvalCriterionId,
    numberEvalCriterionBaseSchema,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const countCompletedEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countCompletedEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema).min(1),
});
export type CountCompletedEvalCriterion = z.infer<
    typeof countCompletedEvalCriterionSchema
>;
export function newCountCompletedEvalCriterion(
    name: string,
    children: BoolEvalCriterionId[],
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CountCompletedEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'countCompletedEvalCriterion',
        children,
    };
}
