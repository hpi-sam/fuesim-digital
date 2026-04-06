import { z } from 'zod';
import { exerciseTemplateIdSchema } from '../ids.js';
import { trainerKeySchema } from '../exercise-keys.js';
import { stringToDate } from './utils.js';

export const getExerciseTemplateResponseDataWithoutTrainerKeySchema = z.object({
    id: exerciseTemplateIdSchema,
    createdAt: stringToDate,
    lastUpdatedAt: stringToDate,
    lastExerciseCreatedAt: z.nullable(stringToDate),
    name: z.string(),
    description: z.string(),
});
export const getExerciseTemplateResponseDataSchema =
    getExerciseTemplateResponseDataWithoutTrainerKeySchema.extend({
        trainerKey: trainerKeySchema,
    });
export type GetExerciseTemplateResponseData = z.infer<
    typeof getExerciseTemplateResponseDataSchema
>;
export type GetExerciseTemplateResponseDataInput = z.input<
    typeof getExerciseTemplateResponseDataSchema
>;

export const postExerciseTemplateRequestDataSchema = z.object({
    name: z.string().trim().nonempty(),
    description: z.string().trim(),
});
export type PostExerciseTemplateRequestData = z.infer<
    typeof postExerciseTemplateRequestDataSchema
>;

export const patchExerciseTemplateRequestDataSchema =
    postExerciseTemplateRequestDataSchema.partial();
export type PatchExerciseTemplateRequestData = z.infer<
    typeof patchExerciseTemplateRequestDataSchema
>;

export const getExerciseTemplatesResponseDataSchema = z.array(
    getExerciseTemplateResponseDataSchema
);

export type GetExerciseTemplatesResponseData = z.infer<
    typeof getExerciseTemplatesResponseDataSchema
>;
export type GetExerciseTemplatesResponseDataInput = z.input<
    typeof getExerciseTemplatesResponseDataSchema
>;
