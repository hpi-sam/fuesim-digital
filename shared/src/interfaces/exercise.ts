import { z } from 'zod';
import {
    exerciseIdSchema,
    exerciseTemplateIdSchema,
    organisationIdSchema,
    parallelExerciseIdSchema,
} from '../ids.js';
import { participantKeySchema, trainerKeySchema } from '../exercise-keys.js';
import { stringToDate } from './utils.js';
import { getExerciseTemplateDetailsResponseDataSchema } from './exercise-template.js';
import { getOrganisationResponseDataSchema } from './organisation.js';

export const getExerciseConfigResponseDataSchema = z.object({
    autoDeleteDays: z.int().nonnegative(),
    parallelExercisesEnabled: z.boolean(),
});
export type GetExerciseConfigResponseData = z.infer<
    typeof getExerciseConfigResponseDataSchema
>;

export const getExerciseResponseDataSchema = z.object({
    id: exerciseIdSchema,
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
    createdAt: stringToDate,
    lastUsedAt: stringToDate,
});
export type GetExerciseResponseData = z.infer<
    typeof getExerciseResponseDataSchema
>;

export const getExerciseDetailsResponseDataSchema = z.object({
    ...getExerciseResponseDataSchema.shape,
    baseTemplate: z
        .object({ id: exerciseTemplateIdSchema, name: z.string() })
        .nullable(),
    organisation: getOrganisationResponseDataSchema,
});

export type GetExerciseDetailsResponseData = z.infer<
    typeof getExerciseResponseDataSchema
>;

export const getExercisesResponseDataSchema = z.array(
    getExerciseDetailsResponseDataSchema
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

export const postExerciseRequestDataSchema = z.object({
    organisationId: organisationIdSchema.nullable(),
    importObject: z.any(),
});
export type PostExerciseRequestData = z.infer<
    typeof postExerciseRequestDataSchema
>;

export const joinExerciseResponseDataSchema = z.object({
    clientId: z.string(),
    exerciseTemplate: z.nullable(
        getExerciseTemplateDetailsResponseDataSchema.omit({
            organisation: true,
        })
    ),
    parallelExerciseId: parallelExerciseIdSchema.nullable(),
});
export type JoinExerciseResponseData = z.infer<
    typeof joinExerciseResponseDataSchema
>;
export type JoinExerciseResponseDataInput = z.input<
    typeof joinExerciseResponseDataSchema
>;
