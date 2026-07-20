import z from 'zod';
import {
    BoolEvalCriterion,
    boolEvalCriterionBaseSchema,
    uuidSchema,
    UUID,
    uuid,
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
    getEvalResultFromCriterion,
    newBoolEvalResult,
    EvalCriterion,
} from 'fuesim-digital-shared';
import { WritableDraft } from 'immer';

export const orEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('orEvalCriterion'),
    children: z.array(uuidSchema).min(1),
});
/**
 * This is a combined bool criterion with an array of bool critrion children by id;
 * Precisely when any children are fullfilled, this should be fullfilled.
 * This is motivated by a diversity of possible solutions of a given exercise scenario.
 */
export type OrEvalCriterion = z.infer<typeof orEvalCriterionSchema>;

export function newOrEvalCriterion(
    name: string,
    children?: UUID[],
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): OrEvalCriterion {
    return {
        id: uuid() as UUID,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'orEvalCriterion',
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
export function getEvalResultOfOrCriterion(
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion as OrEvalCriterion;
    let isCompleted = false;
    let isYellow = false;
    for (let i = 0; i < criterion.children.length; i += 1) {
        const res = getEvalResultFromCriterion(
            context.evalCriteria[
                criterion.children.at(i)!
            ]! as WritableDraft<EvalCriterion>,
            context,
            cache
        );
        if (res.type !== 'boolEvalResult') {
            break;
        } else if (res.isCompleted) {
            isCompleted = true;
            break;
        }
    }
    return newBoolEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion as BoolEvalCriterion,
        isCompleted,
        isYellow
    );
}
