import { z } from 'zod';
import type { UUID } from '../utils/uuid.js';
import { uuid, uuidSchema } from '../utils/uuid.js';
import type { TechnicalChallengeStateId } from './technical-challenge/state-machine.js';
import { technicalChallengeStateIdSchema } from './technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from './technical-challenge/technical-challenge.js';
import { technicalChallengeIdSchema } from './technical-challenge/technical-challenge.js';
import type { PatientStatus } from './utils/patient-status.js';
import { patientStatusSchema } from './utils/patient-status.js';

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

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});

export const patientAtStatusEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('patientAtStatusEvalCriterion'),
    targetPatientId: uuidSchema,
    targetStatus: patientStatusSchema,
});

export const xPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('xPatientsAtStatusEvalCriterion'),
    count: z.int(),
    targetStatus: patientStatusSchema,
});

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('viewScoutableEvalCriterion'),
    targetScoutableId: uuidSchema,
});

/* TODO @JohannesPotzi @Jogius : lessThanXUnqualifiedMeasuresEvalCriterion */

export type DoMeasureXTimesEvalCriterion = z.infer<
    typeof doMeasureXTimesEvalCriterionSchema
>;
export type ReachTechnicalChallengeStateEvalCriterion = z.infer<
    typeof reachTechnicalChallengeStateEvalCriterionSchema
>;
export type PatientAtStatusEvalCriterion = z.infer<
    typeof patientAtStatusEvalCriterionSchema
>;
export type XPatientsAtStatusEvalCriterion = z.infer<
    typeof xPatientsAtStatusEvalCriterionSchema
>;
export type ViewScoutableEvalCriterion = z.infer<
    typeof viewScoutableEvalCriterionSchema
>;
/* TODO @JohannesPotzi @Jogius : Is there a magical way to do this? */
export const evalCritrionTypes = [
    'doMeasureXTimesEvalCriterion',
    'reachTechnicalChallengeStateEvalCriterion',
    'patientAtStatusEvalCriterion',
    'xPatientsAtStatusEvalCriterion',
    'viewScoutableEvalCriterion',
] as const;
export const evalCriterionTypesSchema = z.literal(evalCritrionTypes);
export type EvalcriterionType = z.infer<typeof evalCriterionTypesSchema>;
export const evalCriterionTypesNames: {
    [key in EvalcriterionType]: string;
} = {
    doMeasureXTimesEvalCriterion: 'Maßnahme X Mal',
    reachTechnicalChallengeStateEvalCriterion:
        'Zustand Technischer Herrausvorderung',
    patientAtStatusEvalCriterion: 'Patient mit SK',
    xPatientsAtStatusEvalCriterion: 'X Patienten mit SK',
    viewScoutableEvalCriterion: 'Erkunde auf der Karte',
} as const;
export const evalCriterionSchema = z.discriminatedUnion('criterionType', [
    doMeasureXTimesEvalCriterionSchema,
    reachTechnicalChallengeStateEvalCriterionSchema,
    patientAtStatusEvalCriterionSchema,
    xPatientsAtStatusEvalCriterionSchema,
    viewScoutableEvalCriterionSchema,
]);

export type EvalCriterion = z.infer<typeof evalCriterionSchema>;

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
