import { produce, WritableDraft } from 'immer';
import { ExerciseState } from '../../state.js';
import { applyAction, ExerciseAction } from '../../store/index.js';
import { UUID } from '../uuid.js';
import { EvalResult, EvalResultContext } from './eval-result.js';
import {
    getEvalResultFromCriterion,
    getEvalResultsFromCriteria,
} from './utils.js';
import { EvalCriterion } from '../../models/index.js';
import { isTemporalEvalCriterionType } from '../../models/eval-criteria/index.js';

export function getEvalResultsByExerciseState(state: ExerciseState) {
    return getEvalResultsFromCriteria(
        state.evalCriteria,
        state.evalCriteria,
        state.technicalChallenges,
        state.patients,
        state.scoutables,
        state.measures,
        state.currentTime
    );
}
export function getEvalResultsByActionHistory(
    actions: ExerciseAction[],
    initialStateString: ExerciseState
): { [criterionId: UUID]: EvalResult } {
    if (actions.length === 0) {
        return getEvalResultsByExerciseState(initialStateString);
    }
    const finalState = produce(initialStateString, (draftState) => {
        actions.forEach((action) => {
            applyAction(draftState, action);
        });
    });

    return getEvalResultsByExerciseState(finalState);
}
export function updateEvalResultsMap(
    evalResultsMap: { [criterionId: string]: EvalResult },
    context: EvalResultContext,
    temporalOnly: boolean
): { [criterionId: string]: EvalResult } {
    const tmpCache: { [criterionId: string]: EvalResult } = {};
    return (
        Object.values(
            context.evalCriteria as WritableDraft<{
                [criterionId: UUID]: EvalCriterion;
            }>
        )
            /* For non parallel exercises we only care to cache results
            for temporal criteria, because the rest is selected via
            the exercise selector selectEvalResults. */
            .filter((crit) => {
                if (!temporalOnly) {
                    return true;
                }
                return isTemporalEvalCriterionType(crit.criterionType);
            })
            .flatMap((criterion: EvalCriterion): EvalResult => {
                const previousRes = evalResultsMap[criterion.id];
                return getEvalResultFromCriterion(
                    criterion,
                    context,
                    tmpCache,
                    previousRes
                );
            })
            .reduce<{ [criterionId: UUID]: EvalResult }>(
                (evalResultObject, evalResult) => {
                    evalResultObject[evalResult.criterionId] = evalResult;
                    return evalResultObject;
                },
                {}
            )
    );
}
