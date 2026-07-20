import z from 'zod';
import {
    numberEvalCriterionBaseSchema,
    NumberEvalResult,
    EvalResult,
    EvalResultContext,
    uuid,
    newNumberEvalResult,
    UUID,
    NumberEvalCriterion,
    EvalCriterion,
} from 'fuesim-digital-shared';

export const timestampEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('timestampEvalCriterion'),
    timestamp: z.number(),
});
/** This is a number eval criterion, which holds a constant number, specified on creation;
 *  The number is processed as a timestamp.
 * This synergises with the compare criterion and allows trainers to compare dynamic timestamps from (timesstamp-)number criteria against a constant expected value.*/
export type TimestampEvalCriterion = z.infer<
    typeof timestampEvalCriterionSchema
>;
export function newTimestampEvalCriterion(
    name: string,
    timestamp: number,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): TimestampEvalCriterion {
    return {
        id: uuid() as UUID,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'timestampEvalCriterion',
        timestamp,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfTimestampCriterion(
    evalCriterion: TimestampEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    if (evalCriterion.criterionType !== 'timestampEvalCriterion') {
        console.log(
            `[Bad Input] Trying to evaluate a ${evalCriterion.criterionType} as a timestampEvalCriterion.`
        );
    }
    const criterion = evalCriterion as TimestampEvalCriterion;
    let num = null;

    if (!num) {
        console.log(
            `[logic Error]: trying to return result of numberCriterion${
                criterion.id
            } without calculating the number value. The critrerionType is : ${criterion.criterionType}`
        );
        num = -1;
    }
    num = criterion.timestamp;

    return newNumberEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
