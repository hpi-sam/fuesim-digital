import z from 'zod';
import {
    EvalCriterion,
    EvalCriterionId,
    EvalResult,
    EvalResultContext,
    newNumberEvalResult,
    NumberEvalCriterion,
    numberEvalCriterionBaseSchema,
    NumberEvalCriterionId,
    NumberEvalResult,
} from 'fuesim-digital-shared';
import { uuid } from '../../../utils/uuid.js';

export const constNumEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
    num: z.number(),
});
/** This is a number eval criterion, which holds a constant number, specified on creation.
 * This synergises with the compare criterion and allows trainers to compare dynamic values from number criteria against constant expected value.
 */
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
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfConstNumCriterion(
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    const criterion = evalCriterion as ConstNumEvalCriterion;
    let num = null;
    if (!num) {
        console.log(
            `[logic Error]: trying to return result of numberCriterion${
                criterion.id
            } without calculating the number value. The critrerionType is : ${criterion.criterionType}`
        );
        num = -1;
    }

    num = criterion.num;

    return newNumberEvalResult(
        criterion.id as NumberEvalCriterionId,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
