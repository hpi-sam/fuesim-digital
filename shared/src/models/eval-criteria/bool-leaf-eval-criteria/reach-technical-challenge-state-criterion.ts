import * as z from 'zod';
import { uuid } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    BoolEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newBoolEvalResult } from '../../../utils/eval-result/utils.js';
import type { TechnicalChallengeStateId } from '../../technical-challenge/state-machine.js';
import { technicalChallengeStateIdSchema } from '../../technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from '../../technical-challenge/technical-challenge.js';
import { technicalChallengeIdSchema } from '../../technical-challenge/technical-challenge.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});
/**
 * This is a bool leaf eval criterion which should evaluate as true, precisely when the target technical challenge's state is the target state.
 */
export type ReachTechnicalChallengeStateEvalCriterion = z.infer<
    typeof reachTechnicalChallengeStateEvalCriterionSchema
>;
export function newReachTechnicalChallengeStateEvalCriterion(
    name: string,
    targetTechnicalChallengeId: TechnicalChallengeId,
    targetTechnicalChallengeStateId: TechnicalChallengeStateId,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): ReachTechnicalChallengeStateEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'reachTechnicalChallengeStateEvalCriterion',
        targetTechnicalChallengeId,
        targetTechnicalChallengeStateId,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfReachTechnicalChallengeStateCriterion(
    evalCriterion: ReachTechnicalChallengeStateEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion = evalCriterion;
    /* TODO @JohannesPotzi : implement logic for yellow result. */
    let isCompleted = false;
    const isYellow = false;
    const targetChallengeId = criterion.targetTechnicalChallengeId;
    const targetStateId = criterion.targetTechnicalChallengeStateId;
    const technicalChallenge = context.technicalChallenges[targetChallengeId]!;
    isCompleted = technicalChallenge.currentStateId === targetStateId;
    return newBoolEvalResult(
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
