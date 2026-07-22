import * as z from 'zod';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    BoolEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newBoolEvalResult } from '../../../utils/eval-result/utils.js';
import { currentStateOf } from '../../technical-challenge/state-machine.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('viewScoutableEvalCriterion'),
    targetScoutableId: uuidSchema,
});
/**
 * This is a bool leaf eval criterion which should evaluate as true, precisely when the target scoutable has been viewed by participants.
 */
export type ViewScoutableEvalCriterion = z.infer<
    typeof viewScoutableEvalCriterionSchema
>;
export function newViewScoutableEvalCriterion(
    name: string,
    targetScoutableId: UUID,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): ViewScoutableEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'viewScoutableEvalCriterion',
        targetScoutableId,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfViewScoutableCriterion(
    evalCriterion: ViewScoutableEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion;
    let isCompleted = false;
    const isYellow = false;
    const scoutableChallenge =
        context.technicalChallenges[criterion.targetScoutableId];
    if (scoutableChallenge) {
        isCompleted = Object.values(scoutableChallenge.stateMachines)
            .map(currentStateOf)
            .every((machine) => machine.viewedByParticipants);
    } else {
        const scoutable = context.scoutables[criterion.targetScoutableId]!;
        isCompleted = scoutable.viewedByParticipants;
    }

    return newBoolEvalResult(
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
