import { z } from 'zod';
import { exerciseTemplateIdSchema, parallelExerciseIdSchema } from '../ids.js';
import { participantKeySchema, trainerKeySchema } from '../exercise-keys.js';
import { stringToDate } from './utils.js';
import { getExerciseTemplateResponseDataSchema } from './exercise-template.js';

export const exerciseKeysSchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
});
export type ExerciseKeys = z.infer<typeof exerciseKeysSchema>;

export const getExerciseResponseDataSchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
    createdAt: stringToDate,
    lastUsedAt: stringToDate,
    baseTemplate: z
        .object({ id: exerciseTemplateIdSchema, name: z.string() })
        .nullable(),
});
export type GetExerciseResponseData = z.infer<
    typeof getExerciseResponseDataSchema
>;

export const getExercisesResponseDataSchema = z.array(
    getExerciseResponseDataSchema
);
export type GetExercisesResponseData = z.infer<
    typeof getExercisesResponseDataSchema
>;
export type GetExercisesResponseDataInput = z.input<
    typeof getExercisesResponseDataSchema
>;

export const exerciseExistsResponseDataSchema = z.object({
    exists: z.boolean(),
    autojoin: z.boolean().optional(),
});

export type ExerciseExistsResponseDataInput = z.input<
    typeof exerciseExistsResponseDataSchema
>;

export const joinExerciseResponseDataSchema = z.object({
    clientId: z.string(),
    exerciseTemplate: z.nullable(getExerciseTemplateResponseDataSchema),
    parallelExerciseId: parallelExerciseIdSchema.nullable(),
});
export type JoinExerciseResponseData = z.infer<
    typeof joinExerciseResponseDataSchema
>;
export type JoinExerciseResponseDataInput = z.input<
    typeof joinExerciseResponseDataSchema
>;
