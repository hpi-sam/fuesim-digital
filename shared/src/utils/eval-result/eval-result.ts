import * as z from 'zod';
import type { Immutable } from 'immer';
import { patientSchema } from '../../models/patient.js';
import { scoutableSchema } from '../../models/scoutable.js';
import {
    boolEvalCriterionSchema,
    evalCriterionSchema,
    numberEvalCriterionSchema,
} from '../../models/eval-criteria/criterion-categories.js';
import { technicalChallengeSchema } from '../../models/technical-challenge/technical-challenge.js';
import {
    measureSchema,
    measureTemplateCategorySchema,
} from '../../models/measure/measures.js';
import { uuidSchema } from '../uuid.js';

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
    currentTime: z.number(),
});
export type EvalResultContext = Immutable<
    z.infer<typeof evalResultContextSchema>
>;
