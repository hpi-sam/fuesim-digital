import * as z from 'zod';
import { uuid } from '../../../utils/uuid.js';
import { numberEvalCriterionBaseSchema } from '../eval-criterion-base.js';
import type {
    EvalResultContext,
    EvalResult,
    NumberEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newNumberEvalResult } from '../../../utils/eval-result/utils.js';
import type { NumberEvalCriterion } from '../criterion-categories.js';

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
        id: uuid(),
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
    evalCriterion: ConstNumEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    const criterion = evalCriterion;
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
        criterion.id,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
