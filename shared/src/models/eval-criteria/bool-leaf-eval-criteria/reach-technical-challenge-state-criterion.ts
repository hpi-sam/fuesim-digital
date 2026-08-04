import * as z from 'zod';
import { uuid } from '../../../utils/uuid.js';
import type {
    EvalResultContext,
    EvalResult,
    BoolEvalResult,
} from '../../../utils/eval-result/eval-result.js';
import { newBoolEvalResult } from '../../../utils/eval-result/utils.js';
import {
    StateMachineId,
    stateMachineSchema,
    StateMachineStateId,
    stateMachineStateSchema,
} from '../../technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from '../../technical-challenge/technical-challenge.js';
import {
    technicalChallengeIdSchema,
    technicalChallengeSchema,
} from '../../technical-challenge/technical-challenge.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';
import { Immutable } from 'immer';

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeSchema.shape.id,
    targetStateMachineIds: z.array(stateMachineSchema.shape.id),
    targetStateMachineStateIds: z.record(
        stateMachineSchema.shape.id,
        stateMachineStateSchema.shape.id
    ),
});
/**
 * This is a bool leaf eval criterion which should evaluate as true, precisely when the target technical challenge's state is the target state.
 */
export type ReachTechnicalChallengeStateEvalCriterion = Immutable<
    z.infer<typeof reachTechnicalChallengeStateEvalCriterionSchema>
>;
export function newReachTechnicalChallengeStateEvalCriterion(
    name: string,
    targetTechnicalChallengeId: TechnicalChallengeId,
    targetStateMachineIds: StateMachineId[],
    targetStateMachineStateIds: {
        [targetStateMachineId: StateMachineId]: StateMachineStateId;
    }
): ReachTechnicalChallengeStateEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'reachTechnicalChallengeStateEvalCriterion',
        targetTechnicalChallengeId,
        targetStateMachineIds,
        targetStateMachineStateIds,
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
    const isYellow = false;
    const targetChallengeId = criterion.targetTechnicalChallengeId;
    const technicalChallenge = context.technicalChallenges[targetChallengeId]!;
    let isIncomplete = false;
    const isCompleted = criterion.targetStateMachineIds.every(
        (stateMachineId) => {
            const stateMachine =
                technicalChallenge.stateMachines[stateMachineId];
            const isStateReached =
                stateMachine &&
                stateMachine.currentStateId ===
                    criterion.targetStateMachineStateIds[stateMachineId];
            if (!isStateReached) {
                isIncomplete = true;
            }
            return isStateReached;
        }
    );
    return newBoolEvalResult(
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
