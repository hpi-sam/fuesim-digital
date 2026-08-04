import type {
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
    NumberEvalResult,
} from '../../utils/eval-result/eval-result.js';
import type { UUID } from '../../utils/uuid.js';
import { getEvalResultOfAndCriterion } from './bool-combined-criteria/and-eval-criterion.js';
import { getEvalResultOfCompareCriterion } from './bool-combined-criteria/compare-criterion.js';
import { getEvalResultOfNotCriterion } from './bool-combined-criteria/not-criterion.js';
import { getEvalResultOfOrCriterion } from './bool-combined-criteria/or-criterion.js';
import { getEvalResultOfPatientAtStatusCriterion } from './bool-leaf-eval-criteria/patient-at-status-criterion.js';
import { getEvalResultOfReachTechnicalChallengeStateCriterion } from './bool-leaf-eval-criteria/reach-technical-challenge-state-criterion.js';
import { getEvalResultOfViewScoutableCriterion } from './bool-leaf-eval-criteria/view-scoutable-criterion.js';
import type {
    BoolEvalCriterion,
    BoolEvalCriterionType,
    EvalCriterion,
    EvalCriterionType,
    NumberEvalCriterion,
    NumberEvalCriterionType,
} from './criterion-categories.js';
import {
    boolEvalCritrionTypes,
    combinedEvalCriterionTypes,
    numberEvalCriterionTypes,
    temporalEvalCriterionTypes,
} from './criterion-categories.js';
import { getEvalResultOfConstNumCriterion } from './number-eval-criteria/const-num-criterion.js';
import { getEvalResultOfCountCompletedCriterion } from './number-eval-criteria/count-completed-criterion.js';
import { getEvalResultOfCountMeasuresCriterion } from './number-eval-criteria/count-measures-criterion.js';
import { getEvalResultOfCountPatientsAtStatusCriterion } from './number-eval-criteria/count-patients-at-status-criterion.js';
import { getEvalResultOfFirstTrueAtCriterion } from './number-eval-criteria/first-true-at-criterion.js';
import { getEvalResultOfTimestampCriterion } from './number-eval-criteria/timestamp-criterion.js';

export function isNumberEvalCriterion(
    criterion: EvalCriterion
): criterion is NumberEvalCriterion {
    return numberEvalCriterionTypes.includes(
        // @ts-expect-error: not assignable
        criterion.criterionType
    );
}
export function isBoolEvalCriterion(
    criterion: EvalCriterion
): criterion is BoolEvalCriterion {
    // @ts-expect-error: not assignable
    return boolEvalCritrionTypes.includes(criterion.criterionType);
}
export function isCombinedEvalCriterion(evalCriterion: EvalCriterion) {
    return combinedEvalCriterionTypes.includes(
        // @ts-expect-error: not assignable
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
        criterion: Extract<EvalCriterion, { criterionType: key }>,
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
        criterion: Extract<EvalCriterion, { criterionType: key }>,
        context: EvalResultContext,
        cache?: { [key: string]: EvalResult }
    ) => NumberEvalResult;
} = {
    constNumEvalCriterion: getEvalResultOfConstNumCriterion,
    countCompletedEvalCriterion: getEvalResultOfCountCompletedCriterion,
    countMeasuresEvalCriterion: getEvalResultOfCountMeasuresCriterion,
    countPatientsAtStatusEvalCriterion:
        getEvalResultOfCountPatientsAtStatusCriterion,
    firstTrueAtEvalCriterion: getEvalResultOfFirstTrueAtCriterion,
    timestampEvalCriterion: getEvalResultOfTimestampCriterion,
};
/**
 * Handles sub-criteria-ids with specified callback function
 * @param rootCriterion the combined root-criterion. Non combined criteria do no operations.
 * @param handleChild the callback function to handle a childId.
 */
export function handleSubCriteriaIds(
    rootCriterion: EvalCriterion,
    handleChild: (id: UUID, ...args: any[]) => void,
    ...args: any[]
): void {
    const type = rootCriterion.criterionType;
    if (
        type === 'andEvalCriterion' ||
        type === 'orEvalCriterion' ||
        type === 'countCompletedEvalCriterion'
    ) {
        rootCriterion.children.forEach((id) => {
            handleChild(id, ...args);
        });
    }
    if (type === 'firstTrueAtEvalCriterion' || type === 'notEvalCriterion') {
        handleChild(rootCriterion.child, ...args);
    }
    if (type === 'compareEvalCriterion') {
        handleChild(rootCriterion.leftChild, ...args);
        handleChild(rootCriterion.rightChild, ...args);
    }
}
/**
 * Handles sub-criteria with specified callback function
 * @param rootCriterion the combined root-criterion. Non combined criteria do no operations.
 * @param critaria A Map of criteria. At a minimum containes all criteria in the tree of the rootCriterion.
 * @param handleChild the callback function to handle a sub-criterion
 * @param errorContext This is displayed in the error message, when a child is not contained in the criteria map.
 */
export function handleSubCriteriaByMap(
    rootCriterion: EvalCriterion,
    critaria: { [id: UUID]: EvalCriterion },
    handleChild: (subCriterion: EvalCriterion, ...args: any[]) => void,
    errorContext?: string,
    ...args: any[]
): void {
    function handleChildById(id: UUID) {
        if (!critaria[id]) {
            console.log(
                'LOGIC-ERROR: Handling subCriterion failed. Context: ' +
                    errorContext +
                    ' CriterionId: ' +
                    id
            );
        }
        handleChild(critaria[id]!, ...args);
    }
    handleSubCriteriaIds(rootCriterion, handleChildById);
}
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
    const criteriaMap = criteriaMapIn as {
        [key: UUID]: EvalCriterion | null;
    };
    function removeChildren(id: UUID) {
        let criterion = criteriaMap[id];
        if (criterion) {
            removeChildrenOfCriterion(criteriaMap, criterion);
        }
        criterion = null;
    }
    handleSubCriteriaIds(currentCriterion, removeChildren);
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
/**
 *Recursively calculates the row count of a table with one row for each criterion
 * including the specified criterion and its tree of sub-criteria.
 * @param criterion The root criterion
 * @param criteria A map of criteria. At a minimum includes all criteria of the tree with the specified criterion as the root
 * @returns The row count of a table with one row for each criterion
 * including the specified criterion and its tree of sub-criteria.
 */
export function getEvalCriterionTableLength(
    criterion: EvalCriterion,
    criteria: { [id: UUID]: EvalCriterion }
): number {
    let rootLength = 1;

    if (isCombinedEvalCriterion(criterion)) {
        function recursiveIncrement(child: EvalCriterion) {
            rootLength += 1;
            handleSubCriteriaByMap(
                child,
                criteria,
                getEvalCriterionTableLength
            );
        }
        handleSubCriteriaByMap(criterion, criteria, recursiveIncrement);
    }
    /* console.log('determinining table length. current: ' + rootLength); */
    return rootLength;
}
