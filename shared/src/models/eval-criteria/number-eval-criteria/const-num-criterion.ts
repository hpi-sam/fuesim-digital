import z from 'zod';
import {
    EvalCriterionId,
    numberEvalCriterionBaseSchema,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const constNumEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
    num: z.number(),
});
export type ConstNumEvalCriterion = z.infer<typeof constNumEvalCriterionSchema>;

export function newConstNumEvalCriterion(
    name: string,
    num: number,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): ConstNumEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'constNumEvalCriterion',
        num,
    };
}
