import z from 'zod';
import {
    boolEvalCriterionBaseSchema,
    BoolEvalCriterionId,
    boolEvalCriterionIdSchema,
    EvalCriterionId,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const andEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('andEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema).min(1),
});
export type AndEvalCriterion = z.infer<typeof andEvalCriterionSchema>;

export function newAndEvalCriterion(
    name: string,
    children?: BoolEvalCriterionId[],
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): AndEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'andEvalCriterion',
        children: children ?? [],
    };
}
