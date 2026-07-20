import {
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
    NumberEvalResult,
    getEvalResultOfCompareCriterion,
    BoolEvalCriterion,
    combinedEvalCriterionTypes,
    EvalCriterion,
    UUID,
    EvalCriterionType,
    NumberEvalCriterion,
    numberEvalCriterionTypes,
    temporalEvalCriterionTypes,
    getEvalResultOfAndCriterion,
    getEvalResultOfTimestampCriterion,
    getEvalResultOfCountCompletedCriterion,
    getEvalResultOfFirstTrueAtCriterion,
    getEvalResultOfNotCriterion,
    getEvalResultOfOrCriterion,
    getEvalResultOfPatientAtStatusCriterion,
    getEvalResultOfReachTechnicalChallengeStateCriterion,
    getEvalResultOfViewScoutableCriterion,
    getEvalResultOfConstNumCriterion,
    newCountCompletedEvalCriterion,
    getEvalResultOfCountPatientsAtStatusCriterion,
    BoolEvalCriterionType,
    NumberEvalCriterionType,
} from 'fuesim-digital-shared';

export function isNumberEvalCriterion(
    criterion: EvalCriterion
): criterion is NumberEvalCriterion {
    return numberEvalCriterionTypes.includes(
        //@ts-expect-error: not assignable
        criterion.criterionType
    );
}
export function isBoolEvalCriterion(
    criterion: EvalCriterion
): criterion is BoolEvalCriterion {
    //@ts-expect-error: not assignable
    return boolEvalCritrionTypes.includes(criterion.criterionType);
}
export function isCombinedEvalCriterion(evalCriterion: EvalCriterion) {
    return combinedEvalCriterionTypes.includes(
        //@ts-expect-error: not assignable
        evalCriterion.criterionType
    );
}
export function isTemporalEvalCriterionType(
    evalCriterionType: EvalCriterionType
): evalCriterionType is EvalCriterionType {
    for (const temporalEvalCriterionType of temporalEvalCriterionTypes) {
        if (evalCriterionType === temporalEvalCriterionType) {
            return true;
        }
    }
    return false;
}

export const boolCriterionTypeEvaluatorMap: {
    [key in BoolEvalCriterionType]: (
        criterion: EvalCriterion,
        context: EvalResultContext,
        cache?: { [key: string]: EvalResult }
    ) => BoolEvalResult;
} = {
    andEvalCriterion: getEvalResultOfAndCriterion,
    compareEvalCriterion: getEvalResultOfCompareCriterion,
    notEvalCriterion: getEvalResultOfNotCriterion,
    orEvalCriterion: getEvalResultOfOrCriterion,
    patientAtStatusEvalCriterion: getEvalResultOfPatientAtStatusCriterion,
    reachTechnicalChallengeStateEvalCriterion:
        getEvalResultOfReachTechnicalChallengeStateCriterion,
    viewScoutableEvalCriterion: getEvalResultOfViewScoutableCriterion,
};
export const numberCriterionTypeEvaluatorMap: {
    [key in NumberEvalCriterionType]: (
        criterion: EvalCriterion,
        context: EvalResultContext,
        cache?: { [key: string]: EvalResult }
    ) => NumberEvalResult;
} = {
    constNumEvalCriterion: getEvalResultOfConstNumCriterion,
    countCompletedEvalCriterion: getEvalResultOfCountCompletedCriterion,
    countMeasuresEvalCriterion: getEvalResultOfCountCompletedCriterion,
    countPatientsAtStatusEvalCriterion:
        getEvalResultOfCountPatientsAtStatusCriterion,
    firstTrueAtEvalCriterion: getEvalResultOfFirstTrueAtCriterion,
    timestampEvalCriterion: getEvalResultOfTimestampCriterion,
};
/**
 * recursively removes the childCriteria of an initial eval criterion from the input map
 * @param criteriaMap
 * @param currentCriterion
 * @returns a the modified input map, without the children criteria of the specified criterion
 */
export function removeChildrenOfCriterion(
    criteriaMapIn: { [key: UUID]: EvalCriterion | null },
    currentCriterion?: EvalCriterion
): { [key: UUID]: EvalCriterion | null } {
    if (!currentCriterion) {
        return criteriaMapIn;
    }
    if (!criteriaMapIn[currentCriterion.id]) {
        console.log(
            '[logic Error] When filtering root criteria, the current criterion was not in the criteria.'
        );
        return criteriaMapIn;
    }
    let criteriaMap = criteriaMapIn as {
        [key: UUID]: EvalCriterion | null;
    };
    const type = currentCriterion.criterionType;
    if (
        type === 'andEvalCriterion' ||
        type === 'orEvalCriterion' ||
        type === 'countCompletedEvalCriterion'
    ) {
        for (let i = 0; i < currentCriterion.children.length; i += 1) {
            let criterion = criteriaMap[currentCriterion.children.at(i)!];
            if (criterion) {
                removeChildrenOfCriterion(criteriaMap, criterion);
                criterion = null;
            }
        }
    }
    if (type === 'firstTrueAtEvalCriterion' || type === 'notEvalCriterion') {
        let criterion = criteriaMap[currentCriterion.child];
        if (criterion) {
            removeChildrenOfCriterion(criteriaMap, criterion);
            criterion = null;
        }
    }
    if (type === 'compareEvalCriterion') {
        let leftCriterion = criteriaMap[currentCriterion.leftChild];
        let rightCriterion = criteriaMap[currentCriterion.rightChild];
        if (leftCriterion) {
            removeChildrenOfCriterion(criteriaMap, leftCriterion);
            leftCriterion = null;
        }
        if (rightCriterion) {
            removeChildrenOfCriterion(criteriaMap, rightCriterion);
            rightCriterion = null;
        }
    }
    return criteriaMap;
}
/**
 * From a map of criteria, extracts all root criteria;
 * Is called in the results table to create subTables for root criteria
 * @param criteriaMap map of root criteria and combined criteria
 * @returns all root criteria in the ctriteriaMap as a map
 */
export function getRootCriteriaMap(criteriaMap: {
    [crtierionId: UUID]: EvalCriterion;
}): {
    [CriterionId: UUID]: EvalCriterion;
} {
    const criteria = Object.values(criteriaMap);
    let tmpMap = criteriaMap;
    for (const criterion of criteria) {
        if (isCombinedEvalCriterion(criterion)) {
            tmpMap = Object.values(
                removeChildrenOfCriterion(criteriaMap, criterion)
            ).reduce<{ [key: UUID]: EvalCriterion }>((obj, crit) => {
                if (crit) {
                    obj[crit.id] = crit;
                }
                return obj;
            }, {});
        }
    }
    return tmpMap;
}

/* TODO @JohannesPotzi @Jogius : refactor this after all criteria have their files and all the mappings are done */
/**
 * This is called in the eval results table to generate sub tables
 * @param criterion the root criterion
 * @param criteriaMap (super)set of all relevant criteria as a map;
 * This includes the root criterion and its children
 * @returns The child criteria of the given root criterion as an array
 */
export function getChildrenOfEvalCriterion(
    criterion: EvalCriterion,
    criteriaMap: { [citerionId: UUID]: EvalCriterion }
): EvalCriterion[] {
    if (isCombinedEvalCriterion(criterion)) {
        const type = criterion.criterionType;
        if (
            type === 'andEvalCriterion' ||
            type === 'orEvalCriterion' ||
            type === 'countCompletedEvalCriterion'
        ) {
            return criterion.children
                .filter((id) => criteriaMap[id])
                .map((id) => criteriaMap[id]!);
        }
        if (
            type === 'firstTrueAtEvalCriterion' ||
            type === 'notEvalCriterion'
        ) {
            return [criteriaMap[criterion.child]!];
        }
        if (type === 'compareEvalCriterion') {
            return [
                criteriaMap[criterion.leftChild]!,
                criteriaMap[criterion.rightChild]!,
            ];
        }
    }
    return [] as EvalCriterion[];
}
/**
 * This is used for indexing of sub tables in the results table
 * @param criterion the root criterion
 * @param criteriaMap  (super)set of all relevant criteria as a map;
 * This includes the root criterion and all criteria in its tree
 * @returns the depth of the criterion tree. Non-combined criteria have depth 1
 */
export function getEvalCriterionTreeDepth(
    criterion: EvalCriterion,
    criteriaMap: { [citerionId: UUID]: EvalCriterion }
): number {
    const children = getChildrenOfEvalCriterion(criterion, criteriaMap);
    if (children.length === 0) {
        return 1;
    }
    const childDepths = children.map((child) =>
        getEvalCriterionTreeDepth(child, criteriaMap)
    );
    return Math.max(...childDepths) + 1;
}
