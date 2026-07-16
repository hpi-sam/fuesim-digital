import z from 'zod';
import {
    boolEvalCriterionBaseSchema,
    BoolEvalCriterionId,
    boolEvalCriterionIdSchema,
    EvalCriterionId,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const orEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('orEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema).min(1),
});
/**
 * This is a combined bool criterion with an array of bool critrion children by id;
 * Precisely when any children are fullfilled, this should be fullfilled.
 * This is motivated by a diversity of possible solutions of a given exercise scenario.
 */
export type OrEvalCriterion = z.infer<typeof orEvalCriterionSchema>;
export function newOrEvalCriterion(
    name: string,
    children?: BoolEvalCriterionId[],
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): OrEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'orEvalCriterion',
        children: children ?? [],
    };
}
