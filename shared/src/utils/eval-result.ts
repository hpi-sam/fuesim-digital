import { z } from 'zod';
import type {
    BoolEvalCriterion,
    EvalCriterion,
    EvalCriterionId,
    NumberEvalCriterion,
} from '../models/eval-criterion.js';
import {
    boolEvalCriterionSchema,
    evalCriterionIdSchema,
    isNumberEvalCriterion,
    isTemporalEvalCriterionType,
    numberEvalCriterionSchema,
} from '../models/eval-criterion.js';
import type { Patient } from '../models/patient.js';
import type { Scoutable } from '../models/scoutable.js';
import type { TechnicalChallenge } from '../models/technical-challenge/technical-challenge.js';
import type { UUID } from './uuid.js';
import { uuid, uuidSchema } from './uuid.js';

export const evalResultBaseSchema = z.strictObject({
    id: uuidSchema,
    criterionId: evalCriterionIdSchema,
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
});
export type BoolEvalResult = z.infer<typeof boolEvalResultSchema>;

export const evalResultSchema = z.discriminatedUnion('type', [
    numberEvalResultSchema,
    boolEvalResultSchema,
]);
export type EvalResult = z.infer<typeof evalResultSchema>;

export function getEvalResultFromCriterion(
    evalCriterion: EvalCriterion,
    evalCriteria: { [key: EvalCriterionId]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number,
    cache: { [key: string]: EvalResult },
    previousResult?: EvalResult
): EvalResult {
    function shortCritToRes(evalCriterion: EvalCriterion): EvalResult {
        return getEvalResultFromCriterion(
            evalCriterion,
            evalCriteria,
            technicalChallenges,
            patients,
            scoutables,
            currentTime,
            cache
        );
    }
    /* TODO @JohannesPotzi @Jogius : This reduces redundant visits to criteria in the tree. Can we do Better? */
    if (cache[evalCriterion.id] !== undefined) {
        return cache[evalCriterion.id]!;
    }

    let isCompleted = false;
    let num = null;
    switch (evalCriterion.criterionType) {
        /* ------------------------BOOL CRITERIA------------------------ */
        case 'doMeasureXTimesEvalCriterion': {
            /* TODO @JohannesPotzi @Jogius : implementation*/
            console.log(
                'TODO: implement evaluation of doMeasureXTimesEvalCriterion'
            );
            break;
        }
        case 'reachTechnicalChallengeStateEvalCriterion': {
            const criterion = evalCriterion;
            const targetChallengeId = criterion.targetTechnicalChallengeId;
            const targetStateId = criterion.targetTechnicalChallengeStateId;
            const technicalChallenge = technicalChallenges[targetChallengeId]!;
            isCompleted = technicalChallenge.currentStateId === targetStateId;
            break;
        }
        case 'patientAtStatusEvalCriterion': {
            const criterion = evalCriterion;
            const targetId = criterion.targetPatientId;
            const patient = patients[targetId]!;
            isCompleted = patient.realStatus === criterion.targetStatus;
            break;
        }
        case 'xPatientsAtStatusEvalCriterion': {
            const criterion = evalCriterion;
            num = Object.values(patients).filter(
                (patient) => patient.realStatus === criterion.targetStatus
            ).length;
            isCompleted = num === criterion.targetCount;
            break;
        }
        case 'viewScoutableEvalCriterion': {
            const criterion = evalCriterion;
            const scoutable = scoutables[criterion.targetScoutableId]!;
            isCompleted = scoutable.viewedByParticipants;
            break;
        }
        case 'andEvalCriterion': {
            const criterion = evalCriterion;
            isCompleted = true;
            for (let i = 0; i < criterion.children.length; i += 1) {
                const res = shortCritToRes(
                    evalCriteria[criterion.children[i]!]!
                );
                if (res.type !== 'boolEvalResult' || !res.isCompleted) {
                    isCompleted = false;
                    break;
                }
            }
            break;
        }
        case 'orEvalCriterion': {
            const Criterion = evalCriterion;
            isCompleted = false;
            for (let i = 0; i < Criterion.children.length; i += 1) {
                const res = shortCritToRes(
                    evalCriteria[Criterion.children.at(i)!]!
                );
                if (res.type !== 'boolEvalResult') {
                    break;
                } else if (res.isCompleted) {
                    isCompleted = true;
                    break;
                }
            }
            break;
        }
        case 'notEvalCriterion': {
            const criterion = evalCriterion;
            const res = shortCritToRes(criterion);
            isCompleted =
                res.type === 'boolEvalResult' ? res.isCompleted : true;
            break;
        }
        case 'greaterThanEvalCriterion': {
            const criterion = evalCriterion;
            const leftCrit = evalCriteria[criterion.leftChild];
            const rightCrit = evalCriteria[criterion.rightChild];
            if (!leftCrit || !rightCrit) {
                console.log(
                    `[logic Error] comparing criteria but some are missing with ids: ${
                        leftCrit ? '' : criterion.leftChild
                    }${
                        !leftCrit && !rightCrit ? ', ' : ''
                    }${rightCrit ? '' : criterion.rightChild}`
                );
                break;
            }
            let leftVal = 0;
            let rightVal = 0;
            const leftRes = shortCritToRes(leftCrit);
            const rightRes = shortCritToRes(rightCrit);
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
            isCompleted = leftVal > rightVal;
            break;
        }
        /* ------------------------NUMBER CRITERIA------------------------ */
        case 'constNumEvalCriterion': {
            num = evalCriterion.num;
            break;
        }
        case 'timeStampEvalCriterion': {
            num = evalCriterion.num;
            break;
        }
        case 'countCompletedEvalCriterion': {
            const criterion = evalCriterion;
            num = 0;
            for (let i = 0; i < criterion.children.length; i += 1) {
                const res = shortCritToRes(
                    evalCriteria[criterion.children.at(i)!]!
                );
                if (res.type === 'numberEvalResult') {
                    console.log(
                        `[logic Error] countCompletedEvalCriterion ${
                            criterion.id
                        } contains numberEvalCriterion ${res.criterionId}`
                    );
                } else if (res.isCompleted) {
                    num += 1;
                }
            }
            break;
        }
        case 'firstTrueAtEvalCriterion': {
            const criterion = evalCriterion;
            /* -1 === num means, that the child criterion has not been true yet */
            num = -1;
            if (
                previousResult?.criterionId === criterion.id &&
                previousResult.type === 'numberEvalResult' &&
                previousResult.num !== -1
            ) {
                num = previousResult.num;
            } else if (evalCriteria[criterion.child]) {
                const childRes = shortCritToRes(evalCriteria[criterion.child]!);
                num =
                    childRes.type === 'boolEvalResult' && childRes.isCompleted
                        ? currentTime
                        : -1;
            }
            break;
        }
        default:
            break;
    }
    const id = uuid();
    if (isNumberEvalCriterion(evalCriterion)) {
        if (!num) {
            console.log(
                `[logic Error]: trying to return result of numberCriterion${
                    evalCriterion.id
                } without calculating the number value.`
            );
            num = 0;
        }
        const res: NumberEvalResult = {
            id,
            type: 'numberEvalResult',
            criterionId: evalCriterion.id,
            criterion: evalCriterion as NumberEvalCriterion,
            num,
            timestamp: currentTime,
        };
        cache[evalCriterion.id] = res;
        return res;
    }
    const critRes: BoolEvalResult = {
        id: uuid(),
        criterionId: evalCriterion.id,
        criterion: evalCriterion as BoolEvalCriterion,
        type: 'boolEvalResult',
        isCompleted,
        timestamp: currentTime,
    };
    cache[evalCriterion.id] = critRes;
    return critRes;
}
export function getEvalResultsFromCriteria(
    evalCriteria: { [key: EvalCriterionId]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number
): { [evalCriterionId: UUID]: EvalResult } {
    const criteria = Object.values(evalCriteria);
    const cache: { [key: string]: EvalResult } = {};
    return criteria
        .flatMap(
            (criterion: EvalCriterion): EvalResult =>
                getEvalResultFromCriterion(
                    criterion,
                    evalCriteria,
                    technicalChallenges,
                    patients,
                    scoutables,
                    currentTime,
                    cache
                )
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
    evalCriteria: { [key: EvalCriterionId]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number,
    temporalOnly: boolean
): { [criterionId: string]: EvalResult } {
    const tmpCache: { [criterionId: string]: EvalResult } = {};
    return (
        Object.values(evalCriteria)
            /* For non parallel exercises we only care to cache results for temporal criteria, because the rest is selected via the exeercise selector selectEvalResults. */
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
                    evalCriteria,
                    technicalChallenges,
                    patients,
                    scoutables,
                    currentTime,
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
