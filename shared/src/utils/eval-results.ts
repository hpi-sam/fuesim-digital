import z from 'zod';
import {
    CombinedEvalCriterion,
    CriterionNode,
    EvalCriterion,
    evalCriterionSchema,
    PatientAtStatusEvalCriterion,
    ReachTechnicalChallengeStateEvalCriterion,
    ViewScoutableEvalCriterion,
    XPatientsAtStatusEvalCriterion,
} from '../models/evaluation-criterion.js';
import { Patient, Scoutable, TechnicalChallenge } from '../models/index.js';
import { UUID, uuidSchema } from './uuid.js';

export const evalResultSchema = z.strictObject({
    criterionId: uuidSchema,
    criterion: evalCriterionSchema,
    isCompleted: z.boolean(),
    count: z.number().nullable(),
});
export type EvalResult = z.infer<typeof evalResultSchema>;

export function getIsCompletedFromCriterionNode(
    tree: CriterionNode,
    evalCriteria: {
        [key: string]: EvalCriterion;
    },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number
): boolean {
    function shortIsCompletedFromNode(tree: CriterionNode): boolean {
        return getIsCompletedFromCriterionNode(
            tree,
            evalCriteria,
            technicalChallenges,
            patients,
            scoutables,
            currentTime
        );
    }
    let isCompleted = false;
    switch (tree.type) {
        case 'andNode': {
            for (let i = 0; i < tree.children.length; i += 1) {
                if (!shortIsCompletedFromNode(tree.children[i]!))
                    isCompleted = false;
            }
            break;
        }
        case 'orNode': {
            for (let i = 0; i < tree.children.length; i += 1) {
                if (shortIsCompletedFromNode(tree.children[i]!))
                    isCompleted = true;
            }
            break;
        }
        case 'notNode': {
            return !shortIsCompletedFromNode(tree.child);
        }
        case 'leafNode': {
            const criterion = Object.values(evalCriteria).filter(
                (crit) => crit.id === tree.criterionId
            )[0] as EvalCriterion;
            return getEvalResultFromCriterion(
                criterion,
                evalCriteria,
                technicalChallenges,
                patients,
                scoutables,
                currentTime
            ).isCompleted;
        }
    }
    return isCompleted;
}
export function getEvalResultFromCriterion(
    evalCriterion: EvalCriterion,
    evalCriteria: { [key: string]: EvalCriterion },
    technicalChallenges: { [key: string]: TechnicalChallenge },
    patients: { [key: string]: Patient },
    scoutables: { [key: string]: Scoutable },
    currentTime: number
): EvalResult {
    let isCompleted = false;
    let count = -1;
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
            count = Object.values(patients).filter(
                (patient) => patient.realStatus === criterion.targetStatus
            ).length;
            isCompleted = count === criterion.count;
            break;
        }
        case 'viewScoutableEvalCriterion': {
            const criterion = evalCriterion as ViewScoutableEvalCriterion;
            const scoutable = scoutables[criterion.targetScoutableId]!;
            isCompleted = scoutable.viewedByParticipants;
            break;
        }
        case 'combinedEvalCriterion': {
            const criterion = evalCriterion as CombinedEvalCriterion;
            isCompleted = getIsCompletedFromCriterionNode(
                criterion.combinedEvalCriteriaTree,
                evalCriteria,
                technicalChallenges,
                patients,
                scoutables,
                currentTime
            );
            break;
        }
        default:
            break;
    }
    return {
        criterionId: evalCriterion.id,
        criterion: evalCriterion,
        isCompleted: isCompleted,
        count: count !== -1 ? count : null,
    };
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
