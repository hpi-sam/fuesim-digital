import * as z from 'zod';
import type { Immutable, WritableDraft } from 'immer';
import {
    isBoolEvalCriterion,
    boolCriterionTypeEvaluatorMap,
    numberCriterionTypeEvaluatorMap,
    isTemporalEvalCriterionType,
    getChildrenOfEvalCriterion,
} from '../../models/eval-criteria/utils.js';
import type { Patient } from '../../models/patient.js';
import { patientSchema } from '../../models/patient.js';
import type { Scoutable } from '../../models/scoutable.js';
import { scoutableSchema } from '../../models/scoutable.js';
import type { ExerciseState } from '../../state.js';
import type {
    BoolEvalCriterion,
    EvalCriterion,
    NumberEvalCriterion,
} from '../../models/eval-criteria/criterion-categories.js';
import {
    boolEvalCriterionSchema,
    evalCriterionSchema,
    numberEvalCriterionSchema,
} from '../../models/eval-criteria/criterion-categories.js';
import type { TechnicalChallenge } from '../../models/technical-challenge/technical-challenge.js';
import { technicalChallengeSchema } from '../../models/technical-challenge/technical-challenge.js';
import type {
    Measure,
    MeasureTemplateCategory,
} from '../../models/measure/measures.js';
import {
    measureSchema,
    measureTemplateCategorySchema,
} from '../../models/measure/measures.js';
import { getEvalResultOfFirstTrueAtCriterion } from '../../models/eval-criteria/number-eval-criteria/first-true-at-criterion.js';
import type { ExerciseAction } from '../../store/action-reducers/action-reducers.js';
import { uuidSchema, uuid } from '../uuid.js';
import type { UUID } from '../uuid.js';

export const evalResultBaseSchema = z.strictObject({
    id: uuidSchema,
    criterionId: uuidSchema,
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
    isYellow: z.boolean(),
});
export type BoolEvalResult = z.infer<typeof boolEvalResultSchema>;

export const evalResultSchema = z.discriminatedUnion('type', [
    numberEvalResultSchema,
    boolEvalResultSchema,
]);
export type EvalResult = z.infer<typeof evalResultSchema>;

export const evalResultContextSchema = z.strictObject({
    evalCriteria: z.record(uuidSchema, evalCriterionSchema),
    technicalChallenges: z.record(uuidSchema, technicalChallengeSchema),
    patients: z.record(uuidSchema, patientSchema),
    scoutables: z.record(uuidSchema, scoutableSchema),
    measures: z.record(uuidSchema, measureSchema),
    measureTemplates: z.record(uuidSchema, measureTemplateCategorySchema),
    currentTime: z.number(),
});
export type EvalResultContext = Immutable<
    z.infer<typeof evalResultContextSchema>
>;
