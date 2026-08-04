import { WritableSignal } from '@angular/core';
import {
    EvalCriterion,
    EvalResult,
    getEvalCriterionTableLength,
    handleSubCriteriaIds,
    uuid,
    UUID,
} from 'fuesim-digital-shared';

export interface SubTable {
    id: UUID;
    result: EvalResult;
    index: number;
    subResults: EvalResult[];
    subTables: UUID[];
    localIndent: number;
    indentOffset: boolean[];
    badgeOffset: boolean[];
}

/**
 * Updates a specified signal of subTables.
 * @param rootResults the root results of the resulting table
 * @param evalCriteria all eval-criteria.
 * At a minimum, includes criteria of root results and their tree of sub-criteria.
 * @param results all eval-results. At a minimum, includes root-results and their tree of sub-results.
 * @param globalMaxDepth the maximum criterion-tree depth across root criteria.
 * @param subTablesMapCache
 * @param subTablesByIndex
 * @param subTables
 */
export async function updateSubTables(
    rootResults: EvalResult[],
    evalCriteria: { [critId: UUID]: EvalCriterion },
    results: { [critId: UUID]: EvalResult },
    globalMaxDepth: number,
    subTablesByIndex: WritableSignal<{
        [index: number]: SubTable;
    }>,
    subTables: WritableSignal<SubTable[]>
) {
    const rootLength = rootResults.length;
    let runningIndex = 0;
    /* filling cache with subTables */
    let cache: {
        [tableId: string]: SubTable;
    } = {};
    for (let i = 0; i < rootLength; i += 1) {
        const result = rootResults[i]!;
        await getSubTablesByResult(
            result,
            runningIndex,
            cache,
            results,
            globalMaxDepth,
            subTablesByIndex
        );
        const subTableLength = getEvalCriterionTableLength(
            result.criterion,
            evalCriteria
        );
        runningIndex += subTableLength;
    }
    cache = {};
    let update: SubTable[] = [];
    Object.values(subTablesByIndex()).forEach(
        (subtable) => (update = [...update, subtable])
    );
    /* this.subTablesByIndex.set({});
        this.subTablesMapCache.set({}); */
    subTables.set(update);
}
/**
 * Recursively fills the cache with all subTables from the tree of results
 * @param cache This is the cache for subTables
 * @param result the root result
 * @param runningIndex this gives the index of the SubTable in the results table
 * @param parentId the Id of the parent SubTable
 */
export async function getSubTablesByResult(
    result: EvalResult,
    runningIndex: number,
    cache: {
        [tableId: string]: SubTable;
    },
    results: { [critId: UUID]: EvalResult },
    globalMaxDepth: number,
    subTablesByIndex: WritableSignal<{
        [index: number]: SubTable;
    }>,
    parentId?: UUID
) {
    const crit = result.criterion;
    /* console.log(
            (crit ? 'found crit: ' + crit.name : 'crit not found') +
                ' from-result: ' +
                result.id
        ); */
    let subResults: EvalResult[] = [];
    function addSubResult(
        childId: UUID,
        results: { [criterionId: UUID]: EvalResult }
    ) {
        const subRes = results[childId];
        if (!subRes) {
            console.log(
                'LOGIC-ERROR: creation of subTable failed. subResultId has no member in map. subResultId: ' +
                    childId
            );
        }
        subResults = [...subResults, subRes!];
        /* console.log(
                '[D-O] adding sub-result: ' +
                    subRes?.id +
                    ' parentID: ' +
                    result.id
            ); */
    }
    handleSubCriteriaIds(crit, addSubResult, results);
    const id = uuid();
    cache[id] = {
        id: id,
        result: result,
        index: runningIndex,
        subResults: subResults,
        subTables: [],
        localIndent: 0,
        indentOffset: [],
        badgeOffset: getOffset(globalMaxDepth - 1),
    } as SubTable;
    /* console.log(
                '[subTable index ' +
                    runningIndex +
                    '] caching subTable of ' +
                    result.id +
                    (isCombinedEvalCriterion(crit) ? '[COMBINED]' : '')
            ); */
    if (parentId) {
        let parent = cache[parentId]!;
        parent.subTables.push(id);
        const newIndent = parent.localIndent + 1;
        cache[id].localIndent = newIndent;
        cache[id].badgeOffset = getOffset(globalMaxDepth - newIndent);
        cache[id].indentOffset = getOffset(newIndent);
    }
    subTablesByIndex.update((obj) => {
        obj[runningIndex] = cache[id]!;
        return obj;
    });
    subResults.forEach((res) => {
        runningIndex += 1;
        getSubTablesByResult(
            res,
            runningIndex,
            cache,
            results,
            globalMaxDepth,
            subTablesByIndex,
            id
        );
    });
}
/**
 * This allows for a for-loop to insert the indentation of sub-criteria in the template.
 * @param length the length of the array
 * @returns returns an array of the specified length.
 */
export function getOffset(length: number) {
    let ret = [] as boolean[];
    for (let i = 0; i < length; i += 1) {
        ret = [...ret, true];
    }
    return ret;
}
