import z from 'zod';
import {
    BoolEvalCriterion,
    boolEvalCriterionBaseSchema,
    UUID,
    uuidSchema,
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
    getEvalResultFromCriterion,
    newBoolEvalResult,
    uuid,
    EvalCriterion,
} from 'fuesim-digital-shared';
import { WritableDraft } from 'immer';

export const andEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('andEvalCriterion'),
    children: z.array(uuidSchema).min(1),
});
/**
 * This is a combined bool criterion with an array of bool critrion children by id;
 * Precisely when all children fullfilled, this should be fullfilled.
 * This is motivated by compactness of the results table.
 */
export type AndEvalCriterion = z.infer<typeof andEvalCriterionSchema>;

export function newAndEvalCriterion(
    name: string,
    children?: UUID[],
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): AndEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'andEvalCriterion',
        children: children ?? [],
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfAndCriterion(
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion as AndEvalCriterion;
    let isCompleted = false;
    let isYellow = false;
    let isIncomplete = false;
    let atLeastOneCompleted = false;
    for (const childId of criterion.children) {
        const res = getEvalResultFromCriterion(
            context.evalCriteria[childId]! as WritableDraft<EvalCriterion>,
            context,
            cache
        );
        if (res.type !== 'boolEvalResult' || !res.isCompleted) {
            isIncomplete = true;
        } else if (!atLeastOneCompleted) {
            atLeastOneCompleted = true;
        }
    }
    isCompleted = !isIncomplete;
    isYellow = isIncomplete && atLeastOneCompleted;

    return newBoolEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion as BoolEvalCriterion,
        isCompleted,
        isYellow
    );
}
