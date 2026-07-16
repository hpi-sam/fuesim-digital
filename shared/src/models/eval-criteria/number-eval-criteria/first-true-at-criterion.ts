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
