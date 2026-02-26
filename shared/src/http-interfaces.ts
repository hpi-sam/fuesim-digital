import { z } from 'zod';
import { exerciseTemplateIdSchema } from './ids.js';
import {
    groupParticipantKeySchema,
    participantKeySchema,
    trainerKeySchema,
} from './exercise-keys.js';
import { exerciseStatusSchema } from './models/index.js';

export const exerciseKeysSchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
});
export type ExerciseKeys = z.infer<typeof exerciseKeysSchema>;

export const userDataSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    username: z.string(),
});

export const userDataResponseSchema = z.object({
    user: userDataSchema.nullable().optional(),
    expired: z.boolean().optional(),
    userRegistrationsEnabled: z.boolean().optional(),
    userSelfServiceEnabled: z.boolean().optional(),
});

export type UserDataResponse = z.infer<typeof userDataResponseSchema>;

export interface AuthQueryParams {
    logoutStatus?: 'loggedOut' | 'noSessionFound' | 'sessionExpired';
    loginFailure?: string;
    loginSuccess?: boolean;
}

const stringToDate = z.codec(
    z.iso.datetime({ offset: true }), // input schema: ISO date string
    z.date(), // output schema: Date object
    {
        decode: (isoString) => new Date(isoString), // ISO string → Date
        encode: (date) => date.toISOString(), // Date → ISO string
    }
);

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
    isTemplate: z.boolean(),
});

export type ExerciseExistsResponseDataInput = z.input<
    typeof exerciseExistsResponseDataSchema
>;

export const getExerciseTemplateResponseDataWithoutTrainerKeySchema = z.object({
    id: exerciseTemplateIdSchema,
    createdAt: stringToDate,
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

export const joinExerciseResponseDataSchema = z.object({
    clientId: z.string(),
    exerciseTemplate: z.nullable(getExerciseTemplateResponseDataSchema),
});
export type JoinExerciseResponseData = z.infer<
    typeof joinExerciseResponseDataSchema
>;
export type JoinExerciseResponseDataInput = z.input<
    typeof joinExerciseResponseDataSchema
>;

export const getParallelExerciseResponseDataSchema = z.object({
    id: parallelExerciseIdSchema,
    participantKey: groupParticipantKeySchema,
    createdAt: stringToDate,
    joinViewportId: z.uuidv4(),
    template: getExerciseTemplateResponseDataWithoutTrainerKeySchema,
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
    joinViewportId: z.uuidv4(),
    templateId: exerciseTemplateIdSchema,
});
export type PostParallelExerciseRequestData = z.infer<
    typeof postParallelExerciseRequestDataSchema
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
