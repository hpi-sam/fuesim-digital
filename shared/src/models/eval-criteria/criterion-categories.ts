import { z } from 'zod';
import {
    patientAtStatusEvalCriterionSchema,
    viewScoutableEvalCriterionSchema,
    reachTechnicalChallengeStateEvalCriterionSchema,
    compareEvalCriterionSchema,
    constNumEvalCriterionSchema,
    countCompletedEvalCriterionSchema,
    countPatientsAtStatusEvalCriterionSchema,
    countMeasuresEvalCriterionSchema,
    timestampEvalCriterionSchema,
    firstTrueAtEvalCriterionSchema,
    orEvalCriterionSchema,
    notEvalCriterionSchema,
    andEvalCriterionSchema,
} from 'fuesim-digital-shared';

/* TODO @JohannesPotzi @Jogius : countUnqualifiedMeasuresEvalCriterion */

export const boolEvalCriterionLeafSchema = z.discriminatedUnion(
    'criterionType',
    [
        reachTechnicalChallengeStateEvalCriterionSchema,
        patientAtStatusEvalCriterionSchema,
        viewScoutableEvalCriterionSchema,
    ]
);
export type BoolEvalCriterionLeaf = z.infer<typeof boolEvalCriterionLeafSchema>;

export const boolEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    boolEvalCriterionLeafSchema,
    andEvalCriterionSchema,
    orEvalCriterionSchema,
    notEvalCriterionSchema,
    compareEvalCriterionSchema,
]);
export type BoolEvalCriterion = z.infer<typeof boolEvalCriterionSchema>;

export const numberEvalCriterionSchema = z.discriminatedUnion('criterionType', [
    constNumEvalCriterionSchema,
    countPatientsAtStatusEvalCriterionSchema,
    countCompletedEvalCriterionSchema,
    countMeasuresEvalCriterionSchema,
    timestampEvalCriterionSchema,
    firstTrueAtEvalCriterionSchema,
]);
export type NumberEvalCriterion = z.infer<typeof numberEvalCriterionSchema>;

export const evalCriterionSchema = z.discriminatedUnion('criterionType', [
    boolEvalCriterionSchema,
    numberEvalCriterionSchema,
]);
export type EvalCriterion = z.infer<typeof evalCriterionSchema>;

export type EvalCriterionCategory =
    | 'boolEvalCriterion'
    | 'combinedEvalCriterion'
    | 'numberEvalCriterion';

export const evalCriterionCategoryNames = {
    boolEvalCriterion: 'Erfüllbares Kriterium',
    numberEvalCriterion: 'Zahl-/Zähl Kriterium',
    combinedEvalCriterion: 'Kombiniertes Kriterium',
} as const satisfies { [Key in EvalCriterionCategory]: string };

export type BoolEvalCriterionType = BoolEvalCriterion['criterionType'];
/**
 * used for checking weather a criterion is a bool criterion
 */
export const boolEvalCritrionTypes = [
    'andEvalCriterion',
    'orEvalCriterion',
    'notEvalCriterion',
    'compareEvalCriterion',
    'patientAtStatusEvalCriterion',
    'reachTechnicalChallengeStateEvalCriterion',
    'viewScoutableEvalCriterion',
] satisfies BoolEvalCriterionType[];
/**
 * for the editor drop-down
 */
export const boolEvalCriterionLeafTypes = [
    'patientAtStatusEvalCriterion',
    'reachTechnicalChallengeStateEvalCriterion',
    'viewScoutableEvalCriterion',
] satisfies BoolEvalCriterionType[];

export type NumberEvalCriterionType = NumberEvalCriterion['criterionType'];
/**
 * for the editor drop-down
 */
export const numberEvalCriterionTypes = [
    'constNumEvalCriterion',
    'countPatientsAtStatusEvalCriterion',
    'countCompletedEvalCriterion',
    'countMeasuresEvalCriterion',
    'firstTrueAtEvalCriterion',
    'timestampEvalCriterion',
] satisfies NumberEvalCriterionType[];

export type EvalCriterionType = EvalCriterion['criterionType'];
/**
 * for the editor drop-down
 */
export const combinedEvalCriterionTypes = [
    'andEvalCriterion',
    'orEvalCriterion',
    'countCompletedEvalCriterion',
    'notEvalCriterion',
    'firstTrueAtEvalCriterion',
    'compareEvalCriterion',
] satisfies EvalCriterionType[];

/** Results of criteria with one of these criteriaTypes can not be calculated from the ExerciseState alone.
 * Previous results with this type need to be cached in the respective exercise services.
 */
export const temporalEvalCriterionTypes = [
    'firstTrueAtEvalCriterion',
] satisfies EvalCriterionType[];
export const temporalEvalCriterionSchema = z.discriminatedUnion(
    'criterionType',
    [firstTrueAtEvalCriterionSchema]
);

export type TemporalEvalCriterion = z.infer<typeof temporalEvalCriterionSchema>;

/* TODO @JohannesPotzi @Jogius : To be revised. */
export const evalCriterionTypesNames: {
    [key in EvalCriterionType]: string;
} = {
    countMeasuresEvalCriterion: 'Anzahl Maßnahme',
    reachTechnicalChallengeStateEvalCriterion:
        'Zustand Technischer Herausforderung',
    patientAtStatusEvalCriterion: 'Patient mit SK',
    viewScoutableEvalCriterion: 'Erkundung auf der Karte',
    orEvalCriterion: 'Oder-Kriterium',
    andEvalCriterion: 'Und-Kriterium',
    constNumEvalCriterion: 'Konstante Zahl',
    countCompletedEvalCriterion: 'Anzahl erfüllter Kriterien',
    compareEvalCriterion: 'Mindest-Anzahl Kriterium',
    notEvalCriterion: 'Negation',
    timestampEvalCriterion: 'Zeitpunkt',
    firstTrueAtEvalCriterion: 'Zeitpunkt von Kriterium Erfüllung',
    countPatientsAtStatusEvalCriterion: 'Anzahl von Patienten mit Status',
} as const;
