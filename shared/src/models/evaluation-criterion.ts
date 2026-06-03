import { z, ZodType } from 'zod';
import type { UUID } from '../utils/uuid.js';
import { uuid, uuidSchema } from '../utils/uuid.js';
import type { TechnicalChallengeStateId } from './technical-challenge/state-machine.js';
import { technicalChallengeStateIdSchema } from './technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from './technical-challenge/technical-challenge.js';
import { technicalChallengeIdSchema } from './technical-challenge/technical-challenge.js';
import type { PatientStatus } from './utils/patient-status.js';
import { patientStatusSchema } from './utils/patient-status.js';
import {
    boolEvalResultSchema,
    EvalResult,
    evalResultSchema,
    numberEvalResultSchema,
} from '../utils/eval-results.js';

export const boolEvalCriterionIdSchema = uuidSchema.brand(
    'BoolEvalCriterionId'
);
export type BoolEvalCriterionId = z.infer<typeof boolEvalCriterionIdSchema>;
export const numberEvalCriterionIdSchema = uuidSchema.brand(
    'NumberEvalcriterionId'
);
export type NumberEvalCriterionId = z.infer<typeof numberEvalCriterionIdSchema>;

export const evalCriterionBaseSchema = z.strictObject({
    id: uuidSchema,
    name: z.string(),
    type: z.literal('evalCriterion'),
});
export const boolEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    results: z.array(boolEvalResultSchema),
});

export const andEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('andEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema),
});
export type AndEvalCriterion = z.infer<typeof andEvalCriterionSchema>;
export const orEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('orEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema),
});
export type OrEvalCriterion = z.infer<typeof orEvalCriterionSchema>;
export const notEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('notEvalCriterion'),
    child: boolEvalCriterionIdSchema,
});
export type NotEvalCriterion = z.infer<typeof notEvalCriterionSchema>;
/* TODO @JohannesPotzi @Jogius : maybe generalise this and include an operator? */
export const greaterThanEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('greaterThanEvalCriterion'),
    left: numberEvalCriterionIdSchema,
    right: numberEvalCriterionIdSchema,
});
export type GreaterThanEvalCriterion = z.infer<
    typeof greaterThanEvalCriterionSchema
>;
export const numberEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    results: z.array(numberEvalResultSchema),
    num: z.number(),
});
export const constNumEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
});
export type ConstNumEvalCriterion = z.infer<typeof constNumEvalCriterionSchema>;

export const countEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countEvalCriterion'),
    children: z.array(boolEvalCriterionIdSchema),
});
export type CountEvalCriterion = z.infer<typeof countEvalCriterionSchema>;

export const timeStampEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('timeStampEvalCriterion'),
});
export type TimeStampEvalCriterion = z.infer<
    typeof timeStampEvalCriterionSchema
>;
export const firstTrueAtEvalCriterionSchema = z.strictObject({
    ...timeStampEvalCriterionSchema.shape,
    criterionType: z.literal('firstTrueAtEvalCriterion'),
    child: uuidSchema,
});
export type FirstTrueAtEvalCriterion = z.infer<
    typeof firstTrueAtEvalCriterionSchema
>;

export const countPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
});
export type CountPatientsAtStatusEvalCriterion = z.infer<
    typeof countPatientsAtStatusEvalCriterionSchema
>;

export const doMeasureXTimesEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('doMeasureXTimesEvalCriterion'),
    targetCount: z.number(),
    targetMeasureId: uuidSchema,
});
export type DoMeasureXTimesEvalCriterion = z.infer<
    typeof doMeasureXTimesEvalCriterionSchema
>;

export const reachTechnicalChallengeStateEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('reachTechnicalChallengeStateEvalCriterion'),
    targetTechnicalChallengeId: technicalChallengeIdSchema,
    targetTechnicalChallengeStateId: technicalChallengeStateIdSchema,
});
export type ReachTechnicalChallengeStateEvalCriterion = z.infer<
    typeof reachTechnicalChallengeStateEvalCriterionSchema
>;

export const patientAtStatusEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('patientAtStatusEvalCriterion'),
    targetPatientId: uuidSchema,
    targetStatus: patientStatusSchema,
});
export type PatientAtStatusEvalCriterion = z.infer<
    typeof patientAtStatusEvalCriterionSchema
>;

export const xPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('xPatientsAtStatusEvalCriterion'),
    targetCount: z.number(),
    targetStatus: patientStatusSchema,
});
export type XPatientsAtStatusEvalCriterion = z.infer<
    typeof xPatientsAtStatusEvalCriterionSchema
>;

export const viewScoutableEvalCriterionSchema = z.strictObject({
    ...boolEvalCriterionBaseSchema.shape,
    criterionType: z.literal('viewScoutableEvalCriterion'),
    targetScoutableId: uuidSchema,
});
export type ViewScoutableEvalCriterion = z.infer<
    typeof viewScoutableEvalCriterionSchema
>;

/* TODO @JohannesPotzi @Jogius : lessThanXUnqualifiedMeasuresEvalCriterion */

export const boolEvalCriterionLeafSchema = z.discriminatedUnion(
    'criterionType',
    [
        reachTechnicalChallengeStateEvalCriterionSchema,
        patientAtStatusEvalCriterionSchema,
        viewScoutableEvalCriterionSchema,
        greaterThanEvalCriterionSchema,
        doMeasureXTimesEvalCriterionSchema,
        xPatientsAtStatusEvalCriterionSchema,
    ]
);
export type BoolEvalCriterionLeaf = z.infer<typeof boolEvalCriterionLeafSchema>;

export const boolEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    boolEvalCriterionLeafSchema,
    andEvalCriterionSchema,
    orEvalCriterionSchema,
    notEvalCriterionSchema,
]);
export type BoolEvalCriterion = z.infer<typeof boolEvalCriterionSchema>;

export const numberEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    countPatientsAtStatusEvalCriterionSchema,
    countEvalCriterionSchema,
    timeStampEvalCriterionSchema,
    firstTrueAtEvalCriterionSchema,
]);
export type NumberEvalCriterion = z.infer<typeof numberEvalCriterionSchema>;

export const evalCriterionSchema = z.union([
    boolEvalCriterionSchema,
    numberEvalCriterionSchema,
]);
export type EvalCriterion = z.infer<typeof evalCriterionSchema>;
export type BoolEvalCriterionType = BoolEvalCriterion['criterionType'];
export const boolEvalCritrionTypes = [
    'andEvalCriterion',
    'orEvalCriterion',
    'notEvalCriterion',
    'doMeasureXTimesEvalCriterion',
    'greaterThanEvalCriterion',
    'patientAtStatusEvalCriterion',
    'reachTechnicalChallengeStateEvalCriterion',
    'viewScoutableEvalCriterion',
    'xPatientsAtStatusEvalCriterion',
] satisfies BoolEvalCriterionType[];
export type NumberEvalCriterionType = NumberEvalCriterion['criterionType'];
export const numberEvalCriterionTypes = [
    'constNumEvalCriterion',
    'countEvalCriterion',
    'firstTrueAtEvalCriterion',
    'timeStampEvalCriterion',
] satisfies NumberEvalCriterionType[];
export type EvalcriterionType = BoolEvalCriterionType | NumberEvalCriterionType;

/* TODO @JohannesPotzi @Jogius : Zu überarbeiten. */
export const evalCriterionTypesNames: {
    [key in EvalcriterionType]: string;
} = {
    doMeasureXTimesEvalCriterion: 'Maßnahme X Mal',
    reachTechnicalChallengeStateEvalCriterion:
        'Zustand Technischer Herausforderung',
    patientAtStatusEvalCriterion: 'Patient mit SK',
    xPatientsAtStatusEvalCriterion: 'X Patienten mit SK',
    viewScoutableEvalCriterion: 'Erkunde auf der Karte',
    orEvalCriterion: 'Oder-Kriterium',
    andEvalCriterion: 'Und-Kriterium',
    constNumEvalCriterion: 'konstante Zahl',
    countEvalCriterion: 'Anzahl erfüllter Kriterien',
    greaterThanEvalCriterion: 'mindest-Anzahl Kriterium',
    notEvalCriterion: 'Negierung',
    timeStampEvalCriterion: 'Zeitpunkt',
    firstTrueAtEvalCriterion: 'Frist',
} as const;
export function newDoMeasureXTimesEvalCriterion(
    name: string,
    targetCount: number,
    targetMeasureId: UUID
): DoMeasureXTimesEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        results: [],
        criterionType: 'doMeasureXTimesEvalCriterion',
        targetCount,
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
        results: [],
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
        results: [],
        criterionType: 'patientAtStatusEvalCriterion',
        targetPatientId,
        targetStatus,
    };
}
export function newXPatientsAtStatusEvalCriterion(
    name: string,
    targetCount: number,
    targetStatus: PatientStatus
): XPatientsAtStatusEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        results: [],
        criterionType: 'xPatientsAtStatusEvalCriterion',
        targetCount,
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
        results: [],
        criterionType: 'viewScoutableEvalCriterion',
        targetScoutableId,
    };
}

export function isNumberEvalCriterion(evalCriterion: EvalCriterion): boolean {
    return numberEvalCriterionTypes.find(
        (type) => type === evalCriterion.criterionType
    )
        ? true
        : false;
}
