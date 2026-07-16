import z from 'zod';
import {
    boolEvalCriterionBaseSchema,
    EvalCriterionId,
} from '../criterion-categories.js';
import { uuid, UUID, uuidSchema } from '../../../utils/uuid.js';

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('viewScoutableEvalCriterion'),
    targetScoutableId: uuidSchema,
});
/**
 * This is a bool leaf eval criterion which should evaluate as true, precisely when the target scoutable has been viewed by participants.
 */
export type ViewScoutableEvalCriterion = z.infer<
    typeof viewScoutableEvalCriterionSchema
>;
export function newViewScoutableEvalCriterion(
    name: string,
    targetScoutableId: UUID,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): ViewScoutableEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'viewScoutableEvalCriterion',
        targetScoutableId,
    };
}
