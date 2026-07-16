import z from 'zod';
import {
    EvalCriterionId,
    numberEvalCriterionBaseSchema,
} from '../criterion-categories.js';
import { uuid, UUID, uuidSchema } from '../../../utils/uuid.js';

export const countMeasuresEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countMeasuresEvalCriterion'),
    targetMeasureTemplateId: uuidSchema,
});

export type CountMeasuresEvalCriterion = z.infer<
    typeof countMeasuresEvalCriterionSchema
>;
export function newcountMeasuresEvalCriterion(
    name: string,
    targetMeasureTemplateId: UUID,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CountMeasuresEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'countMeasuresEvalCriterion',
        targetMeasureTemplateId,
    };
}
