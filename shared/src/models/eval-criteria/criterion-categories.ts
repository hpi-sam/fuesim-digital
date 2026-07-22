import { z } from 'zod';
import { reachTechnicalChallengeStateEvalCriterionSchema } from './bool-leaf-eval-criteria/reach-technical-challenge-state-criterion.js';
import { patientAtStatusEvalCriterionSchema } from './bool-leaf-eval-criteria/patient-at-status-criterion.js';
import { viewScoutableEvalCriterionSchema } from './bool-leaf-eval-criteria/view-scoutable-criterion.js';
import { andEvalCriterionSchema } from './bool-combined-criteria/and-eval-criterion.js';
import { orEvalCriterionSchema } from './bool-combined-criteria/or-criterion.js';
import { notEvalCriterionSchema } from './bool-combined-criteria/not-criterion.js';
import { compareEvalCriterionSchema } from './bool-combined-criteria/compare-criterion.js';
import { constNumEvalCriterionSchema } from './number-eval-criteria/const-num-criterion.js';
import { countPatientsAtStatusEvalCriterionSchema } from './number-eval-criteria/count-patients-at-status-criterion.js';
import { countCompletedEvalCriterionSchema } from './number-eval-criteria/count-completed-criterion.js';
import { countMeasuresEvalCriterionSchema } from './number-eval-criteria/count-measures-criterion.js';
import { timestampEvalCriterionSchema } from './number-eval-criteria/timestamp-criterion.js';
import { firstTrueAtEvalCriterionSchema } from './number-eval-criteria/first-true-at-criterion.js';
import { Immutable } from 'immer';

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
export type EvalCriterion = Immutable<z.infer<typeof evalCriterionSchema>>;

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
