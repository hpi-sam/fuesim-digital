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
/** This is a combined number eval criterion with an array of bool children by id;
 * The respecive EvalResult holds the count of fullfilled child criteria.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion.
 */
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
