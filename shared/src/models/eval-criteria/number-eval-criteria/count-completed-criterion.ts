import * as z from 'zod';
import type { WritableDraft } from 'immer';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    NumberEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import {
    getEvalResultFromCriterion,
    newNumberEvalResult,
} from '../../../utils/eval-result/utils.js';
import type {
    EvalCriterion,
    NumberEvalCriterion,
} from '../criterion-categories.js';
import { numberEvalCriterionBaseSchema } from '../eval-criterion-base.js';

export const countCompletedEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countCompletedEvalCriterion'),
    children: z.array(uuidSchema).min(1),
});
/** This is a combined number eval criterion with an array of bool children by id;
 * The respecive EvalResult holds the count of fullfilled child criteria.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion.
 */
export type CountCompletedEvalCriterion = z.infer<
    typeof countCompletedEvalCriterionSchema
>;
export function newCountCompletedEvalCriterion(
    name: string,
    children: UUID[],
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CountCompletedEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'countCompletedEvalCriterion',
        children,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfCountCompletedCriterion(
    criterion: CountCompletedEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): NumberEvalResult {
    let num = null;

    if (!num) {
        console.log(
            `[logic Error]: trying to return result of numberCriterion${
                criterion.id
            } without calculating the number value. The critrerionType is : ${criterion.criterionType}`
        );
        num = -1;
    }

    num = 0;
    for (let i = 0; i < criterion.children.length; i += 1) {
        const res = getEvalResultFromCriterion(
            context.evalCriteria[
                criterion.children.at(i)!
            ]! as WritableDraft<EvalCriterion>,
            context,
            cache
        );
        if (res.type === 'boolEvalResult' && res.isCompleted) {
            num += 1;
        }
    }

    return newNumberEvalResult(
        criterion.id,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
