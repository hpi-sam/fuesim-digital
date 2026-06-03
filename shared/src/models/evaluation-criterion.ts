import { z, ZodType } from 'zod';
import type { UUID } from '../utils/uuid.js';
import { uuid, uuidSchema } from '../utils/uuid.js';
import type { TechnicalChallengeStateId } from './technical-challenge/state-machine.js';
import { technicalChallengeStateIdSchema } from './technical-challenge/state-machine.js';
import type { TechnicalChallengeId } from './technical-challenge/technical-challenge.js';
import { technicalChallengeIdSchema } from './technical-challenge/technical-challenge.js';
import type { PatientStatus } from './utils/patient-status.js';
import { patientStatusSchema } from './utils/patient-status.js';
import { EvalResult, evalResultSchema } from '../utils/eval-results.js';

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
    results: z.record(uuidSchema, evalResultSchema),
});

/* TODO @JohannesPotzi @Jogius : Is there a more elegant way to do this? */
export type AndEvalCriterion = {
    id: UUID;
    name: string;
    type: 'evalCriterion';
    results: { [id: UUID]: EvalResult };
    criterionType: 'andEvalCriterion';
    children: BoolEvalCriterion[];
};
export type OrEvalCriterion = {
    id: UUID;
    name: string;
    type: 'evalCriterion';
    results: { [id: UUID]: EvalResult };
    criterionType: 'orEvalCriterion';
    children: BoolEvalCriterion[];
};
export type NotEvalCriterion = {
    id: UUID;
    name: string;
    type: 'evalCriterion';
    results: { [id: UUID]: EvalResult };
    criterionType: 'notEvalCriterion';
    child: BoolEvalCriterion;
};

export const numberEvalCriterionBaseSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    num: z.number(),
});
export const constNumEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
});
export type ConstNumEvalCriterion = z.infer<typeof constNumEvalCriterionSchema>;

export const timeStampEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('timeStampEvalCriterion'),
});
export type TimeStampEvalCriterion = z.infer<
    typeof timeStampEvalCriterionSchema
>;
export const firstTrueAtEvalCriterionSchema = z.strictObject({
    ...timeStampEvalCriterionSchema.shape,
    child: uuidSchema,
});

export const countPatientsAtStatusEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('constNumEvalCriterion'),
});
export type CountPatientsAtStatusEvalCriterion = z.infer<
    typeof countPatientsAtStatusEvalCriterionSchema
>;

export const doMeasureXTimesEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('doMeasureXTimesEvalCriterion'),
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
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('xPatientsAtStatusEvalCriterion'),
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
export type GreaterThanEvalCriterion = {
    id: UUID;
    name: string;
    type: 'evalCriterion';
    results: { [id: UUID]: EvalResult };
    criterionType: 'greaterThanEvalCriterion';
    left: NumberEvalCriterion;
    right: NumberEvalCriterion;
};

export type BoolEvalCriterionLeaf =
    | ReachTechnicalChallengeStateEvalCriterion
    | PatientAtStatusEvalCriterion
    | ViewScoutableEvalCriterion
    | GreaterThanEvalCriterion;

export const boolEvalCriterionLeafSchema = z.lazy(() =>
    z.discriminatedUnion('criterionType', [
        reachTechnicalChallengeStateEvalCriterionSchema,
        patientAtStatusEvalCriterionSchema,
        viewScoutableEvalCriterionSchema,
        greaterThanEvalCriterionSchema,
    ])
);

export type BoolEvalCriterion =
    | AndEvalCriterion
    | OrEvalCriterion
    | NotEvalCriterion
    | BoolEvalCriterionLeaf;
export const boolEvalCriterionSchema: z.ZodType<BoolEvalCriterion> = z.lazy(
    () =>
        z.discriminatedUnion('criterionType', [
            boolEvalCriterionLeafSchema,
            andEvalCriterionSchema,
            orEvalCriterionSchema,
            notEvalCriterionSchema,
        ])
);
export type CountEvalCriterion = {
    id: UUID;
    name: string;
    type: 'evalCriterion';
    results: { [id: UUID]: EvalResult };
    num: number;
    criterionType: 'countEvalCriterion';
    children: BoolEvalCriterion;
};
export const countEvalCriterionSchema = z.strictObject({
    ...numberEvalCriterionBaseSchema.shape,
    criterionType: z.literal('countEvalCriterion'),
    children: boolEvalCriterionSchema,
});
export const numberEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    countPatientsAtStatusEvalCriterionSchema,
    doMeasureXTimesEvalCriterionSchema,
    xPatientsAtStatusEvalCriterionSchema,
    countEvalCriterionSchema,
]);
export type NumberEvalCriterion = z.infer<typeof numberEvalCriterionSchema>;

export const andEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('andEvalCriterion'),
    children: z.array(boolEvalCriterionSchema),
});
export const orEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('orEvalCriterion'),
    children: z.array(boolEvalCriterionSchema),
});

export const notEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('notEvalCriterion'),
    child: boolEvalCriterionSchema,
});

/* TODO @JohannesPotzi @Jogius : maybe generalise this and include an operator? */
export const greaterThanEvalCriterionSchema = z.strictObject({
    ...evalCriterionBaseSchema.shape,
    criterionType: z.literal('greaterThanEvalCriterion'),
    left: numberEvalCriterionSchema,
    right: numberEvalCriterionSchema,
});

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
] satisfies BoolEvalCriterionType[];
export type NumberEvalCriterionType = NumberEvalCriterion['criterionType'];
export const numberEvalCriterionTypes = [
    'constNumEvalCriterion',
] satisfies NumberEvalCriterionType[];
export type EvalcriterionType = BoolEvalCriterionType | NumberEvalCriterionType;
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
} as const;
export function newDoMeasureXTimesEvalCriterion(
    name: string,
    num: number,
    targetMeasureId: UUID
): DoMeasureXTimesEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        results: {},
        criterionType: 'doMeasureXTimesEvalCriterion',
        num,
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
        results: {},
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
        results: {},
        criterionType: 'patientAtStatusEvalCriterion',
        targetPatientId,
        targetStatus,
    };
}
export function newXPatientsAtStatusEvalCriterion(
    name: string,
    num: number,
    targetStatus: PatientStatus
): XPatientsAtStatusEvalCriterion {
    return {
        id: uuid(),
        name,
        type: 'evalCriterion',
        results: {},
        criterionType: 'xPatientsAtStatusEvalCriterion',
        num,
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
        results: {},
        criterionType: 'viewScoutableEvalCriterion',
        targetScoutableId,
    };
}
