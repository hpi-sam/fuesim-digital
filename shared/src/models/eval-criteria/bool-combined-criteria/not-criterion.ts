import * as z from 'zod';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';
import type {
    EvalResultContext,
    EvalResult,
    BoolEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import {
    getEvalResultFromCriterion,
    newBoolEvalResult,
} from '../../../utils/eval-result/utils.js';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';

export const notEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('notEvalCriterion'),
    child: uuidSchema,
});
/** This is a combined bool criterion with one bool child by id;
 * Precisely, when the child criterion is evaluated as false, this should be fullfilled.
 * This is motivated by trainers needing to check, weather an expected mistake has not been done.
 */
export type NotEvalCriterion = z.infer<typeof notEvalCriterionSchema>;

export function newNotEvalCriterion(
    name: string,
    child: UUID,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): NotEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'notEvalCriterion',
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
export function getEvalResultOfNotCriterion(
    evalCriterion: NotEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion;
    let isCompleted = false;
    /* TODO @Johannes Potzi : Can we just say, that the negation of yellow is always yellow? */
    const isYellow = false;

    const res = getEvalResultFromCriterion(criterion, context, cache);
    isCompleted = res.type === 'boolEvalResult' ? res.isCompleted : true;

    return newBoolEvalResult(
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
