import { z } from 'zod';
import {
    BoolEvalCriterion,
    EvalCriterion,
    NumberEvalCriterion,
    boolEvalCriterionSchema,
    isTemporalEvalCriterionType,
    numberEvalCriterionSchema,
    getChildrenOfEvalCriterion,
    Patient,
    Scoutable,
    TechnicalChallenge,
    UUID,
    uuid,
    uuidSchema,
    Measure,
    MeasureTemplateCategory,
    ExerciseState,
    applyAction,
    ExerciseAction,
    evalCriterionSchema,
    technicalChallengeSchema,
    patientSchema,
    scoutableSchema,
    measureSchema,
    measureTemplateCategorySchema,
    getEvalResultOfFirstTrueAtCriterion,
    isBoolEvalCriterion,
    boolCriterionTypeEvaluatorMap,
    numberCriterionTypeEvaluatorMap,
} from 'fuesim-digital-shared';
import { Immutable, produce, WritableDraft } from 'immer';

export const evalResultBaseSchema = z.strictObject({
    id: uuidSchema,
    criterionId: uuidSchema,
    timestamp: z.number(),
});
export const numberEvalResultSchema = z.strictObject({
    ...evalResultBaseSchema.shape,
    type: z.literal('numberEvalResult'),
    criterion: numberEvalCriterionSchema,
    num: z.number(),
});
export type NumberEvalResult = z.infer<typeof numberEvalResultSchema>;

export const boolEvalResultSchema = z.strictObject({
    ...evalResultBaseSchema.shape,
    type: z.literal('boolEvalResult'),
    criterion: boolEvalCriterionSchema,
    isCompleted: z.boolean(),
    isYellow: z.boolean(),
});
export type BoolEvalResult = z.infer<typeof boolEvalResultSchema>;

export const evalResultSchema = z.discriminatedUnion('type', [
    numberEvalResultSchema,
    boolEvalResultSchema,
]);
export type EvalResult = z.infer<typeof evalResultSchema>;

export const evalResultContextSchema = z.strictObject({
    evalCriteria: z.record(uuidSchema, evalCriterionSchema),
    technicalChallenges: z.record(uuidSchema, technicalChallengeSchema),
    patients: z.record(uuidSchema, patientSchema),
    scoutables: z.record(uuidSchema, scoutableSchema),
    measures: z.record(uuidSchema, measureSchema),
    measureTemplates: z.record(uuidSchema, measureTemplateCategorySchema),
    currentTime: z.number(),
});
export type EvalResultContext = Immutable<
    z.infer<typeof evalResultContextSchema>
>;

export function newEvalResultContext(
    evalCriteria: { [key: UUID]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    measures: { [key: string]: Measure },
    measureTemplates: { [key: string]: MeasureTemplateCategory },
    currentTime: number
): EvalResultContext {
    return {
        evalCriteria,
        technicalChallenges,
        patients,
        scoutables,
        measures,
        measureTemplates,
        currentTime,
    };
}

export function newBoolEvalResult(
    criterionId: UUID,
    timestamp: number,
    criterion: EvalCriterion,
    isCompleted: boolean,
    isYellow: boolean
): BoolEvalResult {
    if (!isBoolEvalCriterion(criterion)) {
        console.log(
            '[Bad Input] trying to assign a non BoolCriterion to a BoolEvalResult'
        );
    }
    return {
        id: uuid(),
        type: 'boolEvalResult',
        criterionId,
        timestamp,
        criterion: criterion as BoolEvalCriterion,
        isCompleted,
        isYellow,
    };
}
export function newNumberEvalResult(
    criterionId: UUID,
    timestamp: number,
    criterion: NumberEvalCriterion,
    num: number
): NumberEvalResult {
    return {
        id: uuid(),
        type: 'numberEvalResult',
        criterionId,
        timestamp,
        criterion,
        num,
    };
}

/**
 * Recursively evaluates subcriteria to get the result of a given root criterion; Called in getEvalResultsFromCriteria
 * @param evalCriterion the criterion for wich the result is specified
 * @param evalCriteria needed for sub-criteria
 * @param technicalChallenges needed for reach technical challenge state criteria
 * @param patients needed for count patients at status and patient at status criteria
 * @param scoutables needed for view scoutable
 * @param currentTime needed for timestamp of result
 * @param cache contains previously calculated results.
 * Reduces unnecessary evaluation of criteria, as criteria might be sub-criteria of other criteria and therefore are referenced multiple times in the state.
 * @param previousResult for first true at criteria.
 * This is only helpful for criteria in the exercise template and for clients which were active when the criteria first should be true.
 * In other cases the calculation needs to be done via the action history.
 * @returns The EvalResult of the given EvalCriterion
 */
export function getEvalResultFromCriterion(
    evalCriterion: EvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult },
    previousResult?: EvalResult
): EvalResult {
    /* TODO @JohannesPotzi @Jogius : This reduces redundant visits to criteria in the tree. Can we do Better? */
    if (cache && cache[evalCriterion.id] !== undefined) {
        return cache[evalCriterion.id]!;
    }
    if (evalCriterion.criterionType === 'firstTrueAtEvalCriterion') {
        return getEvalResultOfFirstTrueAtCriterion(
            evalCriterion,
            context,
            cache,
            previousResult
        );
    } else if (isBoolEvalCriterion(evalCriterion)) {
        /* TODO @JohannesPotzi : as never ... is that correct? */
        return boolCriterionTypeEvaluatorMap[evalCriterion.criterionType](
            evalCriterion as never,
            context,
            cache
        );
    } else {
        return numberCriterionTypeEvaluatorMap[evalCriterion.criterionType](
            evalCriterion as never,
            context,
            cache
        );
    }
}
export function getEvalResultsFromCriteria(
    wantedEvalCriteria: { [key: UUID]: EvalCriterion },
    allEvalCriteria: { [key: UUID]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    measures: { [key: string]: Measure },
    measureTemplates: { [key: string]: MeasureTemplateCategory },
    currentTime: number
): { [evalCriterionId: UUID]: EvalResult } {
    const criteria = Object.values(wantedEvalCriteria);
    const cache: { [key: string]: EvalResult } = {};
    const context = newEvalResultContext(
        allEvalCriteria,
        technicalChallenges,
        patients,
        scoutables,
        measures,
        measureTemplates,
        currentTime
    );
    return criteria
        .flatMap(
            (criterion: EvalCriterion): EvalResult =>
                getEvalResultFromCriterion(criterion, context, cache)
        )
        .reduce<{ [evalCriterionId: UUID]: EvalResult }>(
            (evalResultObject, evalResult) => {
                evalResultObject[evalResult.criterionId] = evalResult;
                return evalResultObject;
            },
            {}
        );
}
export function getNumFromEvalResult(result: EvalResult): number | null {
    return result.type === 'numberEvalResult' ? result.num : null;
}
export function getIsCompletedFromEvalResult(
    result: EvalResult
): boolean | null {
    return result.type === 'boolEvalResult' ? result.isCompleted : null;
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
export function getChildResultsOfResult(
    result: EvalResult,
    resultsMap: { [criterionId: UUID]: EvalResult },
    evalCriteria: { [criterionId: UUID]: EvalCriterion }
) {
    return getChildrenOfEvalCriterion(result.criterion, evalCriteria).reduce<
        EvalResult[]
    >((obj, crit) => {
        const critRes = resultsMap[crit.id];
        if (critRes) {
            obj = [...obj, critRes];
        }
        return obj;
    }, []);
}
export function getEvalResultsByExerciseState(state: ExerciseState) {
    return getEvalResultsFromCriteria(
        state.evalCriteria,
        state.evalCriteria,
        state.technicalChallenges,
        state.patients,
        state.scoutables,
        state.measures,
        state.measureTemplates,
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
