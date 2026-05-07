import { z } from 'zod';
import type { UUID } from '../utils/uuid.js';
import { uuid, uuidSchema } from '../utils/uuid.js';
import type { TechnicalChallengeStateId } from './technical-challenge/state-machine.js';
import { technicalChallengeStateIdSchema } from './technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from './technical-challenge/technical-challenge.js';
import { technicalChallengeIdSchema } from './technical-challenge/technical-challenge.js';
import type { PatientStatus } from './utils/patient-status.js';
import { patientStatusSchema } from './utils/patient-status.js';
import { logicalOperatorSchema } from './utils/cater-for.js';

export const evalCriterionBaseSchema = z.strictObject({
    id: uuidSchema,
    name: z.string(),
    type: z.literal('evalCriterion'),
});

export const doMeasureXTimesEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('doMeasureXTimesEvalCriterion'),
    count: z.int(),
    targetMeasureId: uuidSchema,
});
export type DoMeasureXTimesEvalCriterion = z.infer<
    typeof doMeasureXTimesEvalCriterionSchema
>;

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});
export type ReachTechnicalChallengeStateEvalCriterion = z.infer<
    typeof reachTechnicalChallengeStateEvalCriterionSchema
>;

export const patientAtStatusEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('patientAtStatusEvalCriterion'),
    targetPatientId: uuidSchema,
    targetStatus: patientStatusSchema,
});
export type PatientAtStatusEvalCriterion = z.infer<
    typeof patientAtStatusEvalCriterionSchema
>;

export const xPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('xPatientsAtStatusEvalCriterion'),
    count: z.int(),
    targetStatus: patientStatusSchema,
});
export type XPatientsAtStatusEvalCriterion = z.infer<
    typeof xPatientsAtStatusEvalCriterionSchema
>;

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('viewScoutableEvalCriterion'),
    targetScoutableId: uuidSchema,
});
export type ViewScoutableEvalCriterion = z.infer<
    typeof viewScoutableEvalCriterionSchema
>;

/* TODO @JohannesPotzi @Jogius : lessThanXUnqualifiedMeasuresEvalCriterion */

export const combinedEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('combinedEvalCriterion'),
    criteriaIds: z.array(uuidSchema),
    logicalOperator: logicalOperatorSchema,
});
export type CombinedEvalCriterion = z.infer<typeof combinedEvalCriterionSchema>;

export const evalCriterionSchema = z.discriminatedUnion('criterionType', [
    doMeasureXTimesEvalCriterionSchema,
    reachTechnicalChallengeStateEvalCriterionSchema,
    patientAtStatusEvalCriterionSchema,
    xPatientsAtStatusEvalCriterionSchema,
    viewScoutableEvalCriterionSchema,
    combinedEvalCriterionSchema,
]);

export type EvalCriterion = z.infer<typeof evalCriterionSchema>;
export type EvalcriterionType = EvalCriterion['criterionType'];
export const evalCritrionTypes = [
    'doMeasureXTimesEvalCriterion',
    'reachTechnicalChallengeStateEvalCriterion',
    'patientAtStatusEvalCriterion',
    'xPatientsAtStatusEvalCriterion',
    'viewScoutableEvalCriterion',
    'combinedEvalCriterion',
] satisfies EvalcriterionType[];
export const evalCriterionTypesNames: {
    [key in EvalcriterionType]: string;
} = {
    doMeasureXTimesEvalCriterion: 'Maßnahme X Mal',
    reachTechnicalChallengeStateEvalCriterion:
        'Zustand Technischer Herrausvorderung',
    patientAtStatusEvalCriterion: 'Patient mit SK',
    xPatientsAtStatusEvalCriterion: 'X Patienten mit SK',
    viewScoutableEvalCriterion: 'Erkunde auf der Karte',
    combinedEvalCriterion: 'Kombiniertes Kriterium',
} as const;
export function newDoMeasureXTimesEvalCriterion(
    name: string,
    count: number,
    targetMeasureId: UUID
): DoMeasureXTimesEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'doMeasureXTimesEvalCriterion',
        count,
        targetMeasureId,
    };
}
export function newReachTechnicalChallengeStateEvalCriterion(
    name: string,
    targetTechnicalChallengeId: TechnicalChallengeId,
    targetTechnicalChallengeStateId: TechnicalChallengeStateId
): ReachTechnicalChallengeStateEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'reachTechnicalChallengeStateEvalCriterion',
        targetTechnicalChallengeId,
        targetTechnicalChallengeStateId,
    };
}
export function newPatientAtStatusEvalCriterion(
    name: string,
    targetPatientId: UUID,
    targetStatus: PatientStatus
): PatientAtStatusEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'patientAtStatusEvalCriterion',
        targetPatientId,
        targetStatus,
    };
}
export function newXPatientsAtStatusEvalCriterion(
    name: string,
    count: number,
    targetStatus: PatientStatus
): XPatientsAtStatusEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'xPatientsAtStatusEvalCriterion',
        count,
        targetStatus,
    };
}
export function newViewScoutableEvalCriterion(
    name: string,
    targetScoutableId: UUID
): ViewScoutableEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        criterionType: 'viewScoutableEvalCriterion',
        targetScoutableId,
    };
}
