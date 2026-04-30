import z from 'zod';
import { UUID, uuid, uuidSchema } from '../utils/uuid.js';
import {
    TechnicalChallengeStateId,
    technicalChallengeStateIdSchema,
} from './technical-challenge/state-machine.js';
import {
    TechnicalChallengeId,
    technicalChallengeIdSchema,
} from './technical-challenge/technical-challenge.js';
import { PatientStatus, patientStatusSchema } from './utils/patient-status.js';

export const evalCriterionBaseSchema = z.strictObject({
    id: uuidSchema,
    name: z.string(),
});

export const doMeasureXTimesEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    type: z.literal('doMeasureXTimesEvalCriterion'),
    count: z.int(),
    targetMeasureId: uuidSchema,
});

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    type: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});

export const patientAtStatusEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    type: z.literal('patientAtStatusEvalCriterion'),
    targetPatientId: uuidSchema,
    targetStatus: patientStatusSchema,
});

export const xPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    type: z.literal('xPatientsAtStatusEvalCriterion'),
    count: z.int(),
    targetStatus: patientStatusSchema,
});

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    type: z.literal('viewScoutableEvalCriterion'),
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

export const evalCriterionSchema = z.discriminatedUnion('type', [
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
        name: name,
        type: 'doMeasureXTimesEvalCriterion',
        count: count,
        targetMeasureId: targetMeasureId,
    };
}
export function newReachTechnicalChallengeStateEvalCriterion(
    name: string,
    targetTechnicalChallengeId: TechnicalChallengeId,
    targetTechnicalChallengeStateId: TechnicalChallengeStateId
): ReachTechnicalChallengeStateEvalCriterion {
    return {
        id: uuid(),
        name: name,
        type: 'reachTechnicalChallengeStateEvalCriterion',
        targetTechnicalChallengeId: targetTechnicalChallengeId,
        targetTechnicalChallengeStateId: targetTechnicalChallengeStateId,
    };
}
export function newPatientAtStatusEvalCriterion(
    name: string,
    targetPatientId: UUID,
    targetStatus: PatientStatus
): PatientAtStatusEvalCriterion {
    return {
        id: uuid(),
        name: name,
        type: 'patientAtStatusEvalCriterion',
        targetPatientId: targetPatientId,
        targetStatus: targetStatus,
    };
}
export function newXPatientsAtStatusEvalCriterion(
    name: string,
    count: number,
    targetStatus: PatientStatus
): XPatientsAtStatusEvalCriterion {
    return {
        id: uuid(),
        name: name,
        type: 'xPatientsAtStatusEvalCriterion',
        count: count,
        targetStatus: targetStatus,
    };
}
export function newViewScoutableEvalCriterion(
    name: string,
    targetScoutableId: UUID
): ViewScoutableEvalCriterion {
    return {
        id: uuid(),
        name: name,
        type: 'viewScoutableEvalCriterion',
        targetScoutableId: targetScoutableId,
    };
}
