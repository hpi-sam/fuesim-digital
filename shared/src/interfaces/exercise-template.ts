import { z } from 'zod';
import { exerciseTemplateIdSchema, organisationIdSchema } from '../ids.js';
import { trainerKeySchema } from '../exercise-keys.js';
import { stringToDate } from './utils.js';
import { getOrganisationResponseDataSchema } from './organisation.js';

export const getExerciseTemplateResponseDataSchema = z.object({
    id: exerciseTemplateIdSchema,
    createdAt: stringToDate,
    lastUpdatedAt: stringToDate,
    lastExerciseCreatedAt: z.nullable(stringToDate),
    name: z.string(),
    description: z.string(),
});
export type GetExerciseTemplateResponseData = z.infer<
    typeof getExerciseTemplateResponseDataSchema
>;
export type GetExerciseTemplateResponseDataInput = z.input<
    typeof getExerciseTemplateResponseDataSchema
>;
export const getExerciseTemplateDetailsResponseDataSchema =
    getExerciseTemplateResponseDataSchema.extend({
        trainerKey: trainerKeySchema,
        organisation: getOrganisationResponseDataSchema,
    });
export type GetExerciseTemplateDetailsResponseData = z.infer<
    typeof getExerciseTemplateDetailsResponseDataSchema
>;
export type GetExerciseTemplateDetailsResponseDataInput = z.input<
    typeof getExerciseTemplateDetailsResponseDataSchema
>;

export const postExerciseTemplateRequestDataSchema = z.object({
    organisationId: organisationIdSchema,
    name: z.string().trim().nonempty(),
    description: z.string().trim(),
    importObject: z.any(),
});
export type PostExerciseTemplateRequestData = z.infer<
    typeof postExerciseTemplateRequestDataSchema
>;

export const patchExerciseTemplateRequestDataSchema =
    postExerciseTemplateRequestDataSchema
        .partial()
        .omit({ organisationId: true });
export type PatchExerciseTemplateRequestData = z.infer<
    typeof patchExerciseTemplateRequestDataSchema
>;

export const getExerciseTemplatesResponseDataSchema = z.array(
    getExerciseTemplateDetailsResponseDataSchema
);

export type GetExerciseTemplatesResponseData = z.infer<
    typeof getExerciseTemplatesResponseDataSchema
>;
export type GetExerciseTemplatesResponseDataInput = z.input<
    typeof getExerciseTemplatesResponseDataSchema
>;
