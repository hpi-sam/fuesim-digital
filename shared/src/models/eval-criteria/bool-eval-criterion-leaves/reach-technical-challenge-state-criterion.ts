import z from 'zod';
import {
    boolEvalCriterionBaseSchema,
    EvalCriterionId,
} from '../criterion-categories.js';
import {
    TechnicalChallengeId,
    technicalChallengeIdSchema,
} from '../../technical-challenge/technical-challenge.js';
import {
    TechnicalChallengeStateId,
    technicalChallengeStateIdSchema,
} from '../../technical-challenge/state-machine.js';
import { uuid } from '../../../utils/uuid.js';

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});
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
        id: uuid() as EvalCriterionId,
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'reachTechnicalChallengeStateEvalCriterion',
        targetTechnicalChallengeId,
        targetTechnicalChallengeStateId,
    };
}
