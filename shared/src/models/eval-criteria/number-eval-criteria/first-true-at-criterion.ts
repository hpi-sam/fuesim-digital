import * as z from 'zod';
import type { Immutable, WritableDraft } from 'immer';
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

export const firstTrueAtEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('firstTrueAtEvalCriterion'),
    child: uuidSchema,
});
/** This is a combined number eval criterion with one bool child by id;
 * The respecive EvalResult holds the timestamp when the child criterion was first fullfilled.
 * This synergises with the compare criterion and allows trainers to compare its dynamic value against a number of another number criterion (intended to have a timestamp value).
 */
export type FirstTrueAtEvalCriterion = Immutable<
    z.infer<typeof firstTrueAtEvalCriterionSchema>
>;
export function newFirstTrueAtEvalCriterion(
    name: string,
    child: UUID,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): FirstTrueAtEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'firstTrueAtEvalCriterion',
        child,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfFirstTrueAtCriterion(
    evalCriterion: FirstTrueAtEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult },
    previousResult?: EvalResult
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
    /* -1 === num means, that the child criterion has not been true yet */
    num = -1;
    if (
        previousResult?.criterionId === criterion.id &&
        previousResult.type === 'numberEvalResult' &&
        previousResult.num !== -1
    ) {
        num = previousResult.num;
    } else if (context.evalCriteria[criterion.child]) {
        const childRes = getEvalResultFromCriterion(
            context.evalCriteria[
                criterion.child
            ]! as WritableDraft<EvalCriterion>,
            context,
            cache
        );
        num =
            childRes.type === 'boolEvalResult' && childRes.isCompleted
                ? context.currentTime
                : -1;
    }
    return newNumberEvalResult(
        criterion.id,
        context.currentTime,
        criterion as NumberEvalCriterion,
        num
    );
}
