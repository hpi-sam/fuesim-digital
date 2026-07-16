import z from 'zod';
import {
    EvalCriterionId,
    numberEvalCriterionBaseSchema,
} from '../criterion-categories.js';
import { uuid } from '../../../utils/uuid.js';

export const timestampEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('timestampEvalCriterion'),
    timestamp: z.number(),
});
/** This is a number eval criterion, which holds a constant number, specified on creation;
 *  The number is processed as a timestamp.
 * This synergises with the compare criterion and allows trainers to compare dynamic timestamps from (timesstamp-)number criteria against a constant expected value.*/
export type timestampEvalCriterion = z.infer<
    typeof timestampEvalCriterionSchema
>;
export function newtimestampEvalCriterion(
    name: string,
    timestamp: number,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): timestampEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'timestampEvalCriterion',
        timestamp,
    };
}
