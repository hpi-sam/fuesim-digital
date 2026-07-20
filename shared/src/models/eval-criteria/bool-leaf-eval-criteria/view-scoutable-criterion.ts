import z from 'zod';
import {
    BoolEvalCriterion,
    boolEvalCriterionBaseSchema,
    BoolEvalResult,
    currentStateOf,
    EvalCriterion,
    EvalResult,
    EvalResultContext,
    newBoolEvalResult,
    uuid,
    UUID,
    uuidSchema,
} from 'fuesim-digital-shared';

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
        id: uuid() as UUID,
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
    const criterion = evalCriterion as ViewScoutableEvalCriterion;
    let isCompleted = false;
    let isYellow = false;
    const scoutableChallenge =
        context.technicalChallenges[criterion.targetScoutableId];
    if (scoutableChallenge) {
        const currentState = currentStateOf(scoutableChallenge);
        isCompleted = currentState.viewedByParticipants ?? false;
    } else {
        const scoutable = context.scoutables[criterion.targetScoutableId]!;
        isCompleted = scoutable.viewedByParticipants;
    }

    return newBoolEvalResult(
        criterion.id as UUID,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
