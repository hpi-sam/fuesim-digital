import * as z from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import type { UUID } from '../../../utils/uuid.js';
import { uuid, uuidSchema } from '../../../utils/uuid.js';
import type {
    BoolEvalResult,
    EvalResult,
    EvalResultContext,
} from '../../../utils/eval-result/eval-result.js';
import {
    getEvalResultFromCriterion,
    newBoolEvalResult,
} from '../../../utils/eval-result/utils.js';
import type { EvalCriterion } from '../criterion-categories.js';
import { boolEvalCriterionBaseSchema } from '../eval-criterion-base.js';
export const comparativeOperatorSubSchema = z.union([
    z.literal('greaterThan'),
    z.literal('greaterThanOrEqual'),
    z.literal('lessThan'),
    z.literal('lessThanOrEqual'),
    z.literal('equal'),
]);
export type ComparativeOperator = z.infer<typeof comparativeOperatorSubSchema>;
/* TODO @JohannesPotzi: Idea: seperate SubSchema for the different comp operators */

export const compareEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('compareEvalCriterion'),
    operator: comparativeOperatorSubSchema,
    leftChild: uuidSchema,
    rightChild: uuidSchema,
    redThreshold: z.number(),
});
/* TODO @JohannesPotzi : add motivation */
/** This is a combined bool criterion with two child number criteria by id and a ComparativeOperator;
 * Precisely, when the expression (leftChild operator rightChild) is true, this should be fullfilled.*/
export type CompareEvalCriterion = Immutable<
    z.infer<typeof compareEvalCriterionSchema>
>;

export function newCompareEvalCriterion(
    name: string,
    leftChild: UUID,
    rightChild: UUID,
    operator: ComparativeOperator,
    redThreshold: number,
    isVisibleForParticipants?: boolean,
    isDraft?: boolean
): CompareEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        isVisibleForParticipants: isVisibleForParticipants ?? false,
        isDraft: isDraft ?? false,
        criterionType: 'compareEvalCriterion',
        operator,
        leftChild,
        rightChild,
        redThreshold,
    };
}
/** TODO @JohannesPotzi
 *
 * @param criterion
 * @param context
 * @param cache
 * @returns
 */
export function getEvalResultOfCompareCriterion(
    evalCriterion: CompareEvalCriterion,
    context: EvalResultContext,
    cache?: { [key: string]: EvalResult }
): BoolEvalResult {
    /* TODO @JohannesPotzi: Test this. */
    const criterion = evalCriterion;
    let isCompleted = false;
    let isYellow = false;
    const leftCrit = context.evalCriteria[
        criterion.leftChild
    ] as WritableDraft<EvalCriterion>;
    const rightCrit = context.evalCriteria[
        criterion.rightChild
    ] as WritableDraft<EvalCriterion>;
    if (!leftCrit || !rightCrit) {
        console.log(
            `[logic Error] comparing criteria but some are missing with ids: ${
                leftCrit ? '' : criterion.leftChild
            }${
                !leftCrit && !rightCrit ? ', ' : ''
            }${rightCrit ? '' : criterion.rightChild}`
        );
    }
    let leftVal = 0;
    let rightVal = 0;
    const leftRes = getEvalResultFromCriterion(leftCrit, context, cache);
    const rightRes = getEvalResultFromCriterion(rightCrit, context, cache);
    const isLeftNum = leftRes.type === 'numberEvalResult';
    const isRightNum = rightRes.type === 'numberEvalResult';
    if (!isLeftNum || !isRightNum) {
        console.log(
            `[logic Error] comparing criteria but some are not numberCriteria with ids: ${
                isLeftNum ? '' : criterion.leftChild
            }${
                !isLeftNum && !isRightNum ? ', ' : ''
            }${isRightNum ? '' : criterion.rightChild}`
        );
    }
    /* boolean are converted to numbers appropiately */
    if (!isLeftNum) {
        leftVal = leftRes.isCompleted ? 1 : 0;
    } else {
        leftVal = leftRes.num;
    }
    if (!isRightNum) {
        rightVal = rightRes.isCompleted ? 1 : 0;
    } else {
        rightVal = rightRes.num;
    }
    /* the comparison */
    switch (criterion.operator) {
        case 'greaterThanOrEqual': {
            if (leftVal >= rightVal) {
                isCompleted = true;
            } else if (leftVal >= criterion.redThreshold) {
                isYellow = true;
            }
            break;
        }
        case 'greaterThan': {
            if (leftVal > rightVal) {
                isCompleted = true;
            } else if (leftVal > criterion.redThreshold) {
                isYellow = true;
            }
            break;
        }
        case 'lessThanOrEqual': {
            if (leftVal <= rightVal) {
                isCompleted = true;
            } else if (leftVal <= criterion.redThreshold) {
                isYellow = true;
            }
            break;
        }
        case 'lessThan': {
            if (leftVal < rightVal) {
                isCompleted = true;
            } else if (leftVal < criterion.redThreshold) {
                isYellow = true;
            }
            break;
        }
        case 'equal': {
            if (leftVal === rightVal) {
                isCompleted = true;
            } else if (Math.abs(leftVal - rightVal) <= criterion.redThreshold)
                isYellow = true;
            break;
        }
    }
    isCompleted = leftVal > rightVal;
    return newBoolEvalResult(
        criterion.id,
        context.currentTime,
        criterion,
        isCompleted,
        isYellow
    );
}
