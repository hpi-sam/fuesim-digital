import z from 'zod';
import {
    BoolEvalCriterion,
    boolEvalCriterionBaseSchema,
    BoolEvalCriterionId,
    boolEvalCriterionIdSchema,
    EvalCriterionId,
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
    getEvalResultFromCriterion,
    newBoolEvalResult,
    uuid,
    EvalCriterion,
} from 'fuesim-digital-shared';

export const notEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('notEvalCriterion'),
    child: boolEvalCriterionIdSchema,
});
/** This is a combined bool criterion with one bool child by id;
 * Precisely, when the child criterion is evaluated as false, this should be fullfilled.
 * This is motivated by trainers needing to check, weather an expected mistake has not been done.
 */
export type NotEvalCriterion = z.infer<typeof notEvalCriterionSchema>;

export function newNotEvalCriterion(
    name: string,
    child: BoolEvalCriterionId,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): NotEvalCriterion {
    return {
        id: uuid() as EvalCriterionId,
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
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion as NotEvalCriterion;
    let isCompleted = false;
    /* TODO @Johannes Potzi : Can we just say, that the negation of yellow is always yellow? */
    let isYellow = false;

    const res = getEvalResultFromCriterion(criterion, context, cache);
    isCompleted = res.type === 'boolEvalResult' ? res.isCompleted : true;

    return newBoolEvalResult(
        criterion.id as BoolEvalCriterionId,
        context.currentTime,
        criterion as BoolEvalCriterion,
        isCompleted,
        isYellow
    );
}
