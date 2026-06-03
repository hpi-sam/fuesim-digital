import { z } from 'zod';
import {
    AndEvalCriterion,
    BoolEvalCriterion,
    EvalCriterion,
    evalCriterionSchema,
    FirstTrueAtEvalCriterion,
    isNumberEvalCriterion,
    NotEvalCriterion,
    OrEvalCriterion,
    PatientAtStatusEvalCriterion,
    ReachTechnicalChallengeStateEvalCriterion,
    ViewScoutableEvalCriterion,
    XPatientsAtStatusEvalCriterion,
} from '../models/evaluation-criterion.js';
import { Patient, Scoutable, TechnicalChallenge } from '../models/index.js';
import { uuid, UUID, uuidSchema } from './uuid.js';

export const evalResultBaseSchema = z.strictObject({
    id: uuidSchema,
    criterionId: uuidSchema,
    timestamp: z.number(),
});
export const numberEvalResultSchema = z.strictObject({
    ...evalResultBaseSchema.shape,
    type: z.literal('numberEvalResult'),
    num: z.number(),
});
export type NumberEvalResult = z.infer<typeof numberEvalResultSchema>;

export const boolEvalResultSchema = z.strictObject({
    ...evalResultBaseSchema.shape,
    type: z.literal('boolEvalResult'),
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
    evalCriteria: { [key: string]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number
): EvalResult {
    function shortCritToRes(evalCriterion: EvalCriterion): EvalResult {
        return getEvalResultFromCriterion(
            evalCriterion,
            evalCriteria,
            technicalChallenges,
            patients,
            scoutables,
            currentTime
        );
    }
    /* TODO @JohannesPotzi @Jogius : This reduces redundant visits to criteria in the tree. Can we do Better? */
    if (evalCriterion.results.length >= 1) {
        const latestResult = evalCriterion.results.at(
            evalCriterion.results.length - 1
        )!;
        if (latestResult.timestamp === currentTime) {
            return latestResult;
        }
    }
    let isCompleted = false;
    let num = null;
    switch (evalCriterion.criterionType) {
        case 'doMeasureXTimesEvalCriterion': {
            /* TODO @JohannesPotzi @Jogius */
            console.log(
                'TODO: implement evaluation of doMeasureXTimesEvalCriterion'
            );
            break;
        }
        case 'reachTechnicalChallengeStateEvalCriterion': {
            const criterion =
                evalCriterion as ReachTechnicalChallengeStateEvalCriterion;
            const targetChallengeId = criterion.targetTechnicalChallengeId;
            const targetStateId = criterion.targetTechnicalChallengeStateId;
            const technicalChallenge = technicalChallenges[targetChallengeId]!;
            isCompleted = technicalChallenge.currentStateId === targetStateId;
            break;
        }
        case 'patientAtStatusEvalCriterion': {
            const criterion = evalCriterion as PatientAtStatusEvalCriterion;
            const targetId = criterion.targetPatientId;
            const patient = patients[targetId]!;
            isCompleted = patient.realStatus === criterion.targetStatus;
            break;
        }
        case 'xPatientsAtStatusEvalCriterion': {
            const criterion = evalCriterion as XPatientsAtStatusEvalCriterion;
            num = Object.values(patients).filter(
                (patient) => patient.realStatus === criterion.targetStatus
            ).length;
            isCompleted = num === criterion.targetCount;
            break;
        }
        case 'viewScoutableEvalCriterion': {
            const criterion = evalCriterion as ViewScoutableEvalCriterion;
            const scoutable = scoutables[criterion.targetScoutableId]!;
            isCompleted = scoutable.viewedByParticipants;
            break;
        }
        case 'andEvalCriterion': {
            const Criterion = evalCriterion as AndEvalCriterion;
            isCompleted = true;
            for (let i = 0; i < Criterion.children.length; i += 1) {
                const res = shortCritToRes(
                    evalCriteria[Criterion.children[i]!]!
                );
                if (res.type !== 'boolEvalResult' || !res.isCompleted) {
                    isCompleted = false;
                    break;
                }
            }
            break;
        }
        case 'orEvalCriterion': {
            const Criterion = evalCriterion as OrEvalCriterion;
            isCompleted = false;
            for (let i = 0; i < Criterion.children.length; i += 1) {
                const res = shortCritToRes(
                    evalCriteria[Criterion.children[i]!]!
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
            const criterion = evalCriterion as NotEvalCriterion;
            const res = shortCritToRes(criterion);
            isCompleted =
                res.type === 'boolEvalResult' ? res.isCompleted : true;
            break;
        }
        default:
            break;
    }
    const id = uuid();
    if (isNumberEvalCriterion(evalCriterion)) {
        if (!num) {
            console.log(
                '[logic Error]: trying to return result of numberCriterion' +
                    evalCriterion.id +
                    ' without calculating the number value.'
            );
            num = 0;
        }
        return {
            id: id,
            criterionId: evalCriterion.id,
            num: num,
            timestamp: currentTime,
        } as NumberEvalResult;
    } else
        return {
            id: uuid(),
            criterionId: evalCriterion.id,
            isCompleted: isCompleted,
            timestamp: currentTime,
        } as BoolEvalResult;
}
export function getEvalResultsFromCriteria(
    evalCriteria: { [key: string]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number
): { [evalCriterionId: UUID]: EvalResult } {
    return Object.values(evalCriteria)
        .flatMap((evalCriterion: EvalCriterion): EvalResult => {
            return getEvalResultFromCriterion(
                evalCriterion,
                evalCriteria,
                technicalChallenges,
                patients,
                scoutables,
                currentTime
            );
        })
        .reduce<{ [evalCriterionId: UUID]: EvalResult }>(
            (evalResultObject, evalResult) => {
                evalResultObject[evalResult.criterionId] = evalResult;
                return evalResultObject;
            },
            {}
        );
}
