import z from 'zod';
import {
    BoolEvalCriterionId,
    EvalCriterionId,
    evalCriterionIdSchema,
    numberEvalCriterionBaseSchema,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const firstTrueAtEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('firstTrueAtEvalCriterion'),
    child: evalCriterionIdSchema,
});
/** This is a combined number eval criterion with one bool child by id;
 * The respecive EvalResult holds the timestamp when the child criterion was first fullfilled.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion (intended to have a timestamp value).
 */
export type FirstTrueAtEvalCriterion = z.infer<
    typeof firstTrueAtEvalCriterionSchema
>;
export function newFirstTrueAtEvalCriterion(
    name: string,
    child: BoolEvalCriterionId,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): FirstTrueAtEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'firstTrueAtEvalCriterion',
        child,
    };
}
