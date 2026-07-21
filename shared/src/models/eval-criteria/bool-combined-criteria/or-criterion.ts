import * as z from 'zod';
import type { WritableDraft } from 'immer';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    BoolEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import {
    getEvalResultFromCriterion,
    newBoolEvalResult,
} from '../../../utils/eval-result/utils.js';
import type { EvalCriterion } from '../criterion-categories.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';

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
        id: uuid(),
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
    evalCriterion: OrEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion;
    let isCompleted = false;
    const isYellow = false;
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
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
