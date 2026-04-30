import { z } from 'zod';
import { exerciseTemplateIdSchema, parallelExerciseIdSchema } from '../ids.js';
import {
    groupParticipantKeySchema,
    participantKeySchema,
    trainerKeySchema,
} from '../exercise-keys.js';
import { validationMessages } from '../validation-messages.js';
import { exerciseStatusSchema } from '../models/utils/exercise-status.js';
import { logEntrySchema } from '../models/log-entry.js';
import { getExerciseTemplateResponseDataSchema } from './exercise-template.js';
import { stringToDate } from './utils.js';

export const getParallelExerciseResponseDataSchema = z.object({
    id: parallelExerciseIdSchema,
    participantKey: groupParticipantKeySchema,
    createdAt: stringToDate,
    name: z.string(),
    joinViewportId: z.uuidv4(),
    template: getExerciseTemplateResponseDataSchema,
});
export type GetParallelExerciseResponseData = z.infer<
    typeof getParallelExerciseResponseDataSchema
>;
export const getParallelExercisesResponseDataSchema = z.array(
    getParallelExerciseResponseDataSchema
);
export type GetParallelExercisesResponseData = z.infer<
    typeof getParallelExercisesResponseDataSchema
>;

export const postParallelExerciseRequestDataSchema = z.object({
    joinViewportId: z.uuidv4(validationMessages.required),
    templateId: exerciseTemplateIdSchema,
    name: z.string().nonempty(validationMessages.required).trim(),
});
export type PostParallelExerciseRequestData = z.infer<
    typeof postParallelExerciseRequestDataSchema
>;

export const patchParallelExerciseRequestDataSchema =
    postParallelExerciseRequestDataSchema.pick({ name: true });
export type PatchParallelExerciseRequestData = z.infer<
    typeof patchParallelExerciseRequestDataSchema
>;

export const getExerciseTemplateViewportsResponseDataSchema = z.array(
    z.object({
        id: z.uuidv4(),
        name: z.string(),
    })
);
export type GetExerciseTemplateViewportsResponseData = z.infer<
    typeof getExerciseTemplateViewportsResponseDataSchema
>;

export const postJoinParallelExerciseResponseDataSchema = z.object({
    participantKey: participantKeySchema,
});

export const parallelExerciseInstanceSummarySchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
    clientNames: z.array(z.string()),
    currentTime: z.number(),
    currentStatus: exerciseStatusSchema,
    lastLogEntry: z.optional(logEntrySchema),
    isActive: z.boolean(),
});
export type ParallelExerciseInstanceSummary = z.infer<
    typeof parallelExerciseInstanceSummarySchema
>;

export const parallelExerciseInstancesSchema = z.array(
    parallelExerciseInstanceSummarySchema
);

export const joinParallelExerciseResponseDataSchema = z.object({
    exerciseInstances: parallelExerciseInstancesSchema,
});
export type JoinParallelExerciseResponseData = z.infer<
    typeof joinParallelExerciseResponseDataSchema
>;

export const updateParallelExerciseInstancesSchema = z.object({
    exerciseInstances: parallelExerciseInstancesSchema,
});
export type UpdateParallelExerciseResponseData = z.infer<
    typeof updateParallelExerciseInstancesSchema
>;
