import z from 'zod';
import {
    BoolEvalCriterion,
    boolEvalCriterionBaseSchema,
    UUID,
    BoolEvalResult,
    EvalCriterion,
    EvalResult,
    EvalResultContext,
    newBoolEvalResult,
    TechnicalChallengeId,
    technicalChallengeIdSchema,
    TechnicalChallengeStateId,
    technicalChallengeStateIdSchema,
    uuid,
} from 'fuesim-digital-shared';

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
        id: uuid() as UUID,
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
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    const criterion =
        evalCriterion as ReachTechnicalChallengeStateEvalCriterion;
    /* TODO @JohannesPotzi : implement logic for yellow result. */
    let isCompleted = false;
    let isYellow = false;
    const targetChallengeId = criterion.targetTechnicalChallengeId;
    const targetStateId = criterion.targetTechnicalChallengeStateId;
    const technicalChallenge = context.technicalChallenges[targetChallengeId]!;
    isCompleted = technicalChallenge.currentStateId === targetStateId;
    return newBoolEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion as BoolEvalCriterion,
        isCompleted,
        isYellow
    );
}
