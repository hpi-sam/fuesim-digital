import * as z from 'zod';
import type { Immutable, WritableDraft } from 'immer';
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
import type { EvalCriterion } from '../criterion-categories.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';

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
export type AndEvalCriterion = Immutable<
    z.infer<typeof andEvalCriterionSchema>
>;

export function newAndEvalCriterion(
    name: string,
    children?: UUID[]
): AndEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
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
    evalCriterion: AndEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion;
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
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
