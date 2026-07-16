import z from 'zod';
import {
    boolEvalCriterionBaseSchema,
    EvalCriterionId,
    NumberEvalCriterionId,
    numberEvalCriterionIdSchema,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';
export const comparativeOperatorSubSchema = z.union([
    z.literal('greaterThan'),
    z.literal('greaterThanOrEqual'),
    z.literal('lessThan'),
    z.literal('lessThanOrEqual'),
    z.literal('equal'),
]);
export type ComparativeOperator = z.infer<typeof comparativeOperatorSubSchema>;
/* TODO @JohannesPotzi: Idea: seperate SubSchema for the different comp operators */
export const compareEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('compareEvalCriterion'),
    operator: comparativeOperatorSubSchema,
    leftChild: numberEvalCriterionIdSchema,
    rightChild: numberEvalCriterionIdSchema,
    greenThreshold: z.number(),
    yellowThreshold: z.number(),
    redThreshold: z.number(),
});
export type CompareEvalCriterion = z.infer<typeof compareEvalCriterionSchema>;

export function newCompareEvalCriterion(
    name: string,
    leftChild: NumberEvalCriterionId,
    rightChild: NumberEvalCriterionId,
    operator: ComparativeOperator,
    greenThreshold: number,
    yellowThreshold: number,
    redThreshold: number,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CompareEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'compareEvalCriterion',
        operator,
        leftChild,
        rightChild,
        greenThreshold,
        yellowThreshold,
        redThreshold,
    };
}
