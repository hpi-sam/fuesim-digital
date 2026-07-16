import z from 'zod';
import { uuid } from '../../../utils/uuid.js';
import {
    boolEvalCriterionBaseSchema,
    BoolEvalCriterionId,
    boolEvalCriterionIdSchema,
    EvalCriterionId,
} from '../criterion-categories.js';

export const notEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('notEvalCriterion'),
    child: boolEvalCriterionIdSchema,
});
/** This is a combined bool criterion with one bool child by id;
 * Precisely, when the child criterion is evaluated as false, this should be fullfilled.
 * This is motivated by trainers needing to check, weather an expected mistake has not been done.
 */
export type NotEvalCriterion = z.infer<typeof notEvalCriterionSchema>;

export function newNotEvalCriterion(
    name: string,
    child: BoolEvalCriterionId,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): NotEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'notEvalCriterion',
        child,
    };
}
