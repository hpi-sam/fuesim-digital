import { z } from 'zod';
import type { ParticipantKey, TrainerKey } from './exercise-keys.js';
import { participantKeySchema, trainerKeySchema } from './exercise-keys.js';

export class ApiError extends Error {
    public statusCode = 400;
}
export class NotFoundError extends ApiError {
    public override statusCode = 404;
    public constructor() {
        super(`Das Objekt existiert nicht.`);
    }
}
export class PermissionDeniedError extends ApiError {
    public override statusCode = 403;
    public constructor() {
        super('Sie haben keine Berechtigung für diese Operation.');
    }
}

export interface ExerciseKeys {
    readonly participantKey: ParticipantKey;
    readonly trainerKey: TrainerKey;
}

export interface ExerciseAccessIds {
    readonly participantId: string;
    readonly trainerId: string;
}

export const userDataResponseSchema = z.object({
    user: z
        .object({
            id: z.string(),
            displayName: z.string(),
            username: z.string(),
        })
        .nullable()
        .optional(),
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

export const exerciseSchema = z.object({
    participantId: participantKeySchema,
    trainerId: trainerKeySchema,
    createdAt: stringToDate,
    lastUsedAt: stringToDate,
    baseTemplate: z.nullable(z.object({ id: z.uuid(), name: z.string() })),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const exercisesSchema = z.array(exerciseSchema);
export type Exercises = z.infer<typeof exercisesSchema>;
export type ExercisesInput = z.input<typeof exercisesSchema>;

export const exerciseExistsSchema = z.object({
    isTemplate: z.boolean(),
});

export type ExerciseExistsInput = z.input<typeof exerciseExistsSchema>;

export const exerciseTemplateSchema = z.object({
    id: z.uuid(),
    trainerId: trainerKeySchema,
    createdAt: stringToDate,
    lastExerciseCreatedAt: z.nullable(stringToDate),
    name: z.string(),
    description: z.string(),
});
export const exerciseTemplateCreateSchema = z.object({
    name: z.string(),
    description: z.string(),
});
export type ExerciseTemplateCreateData = z.infer<
    typeof exerciseTemplateCreateSchema
>;
export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;
export type ExerciseTemplateInput = z.input<typeof exerciseTemplateSchema>;

export const exerciseTemplatesSchema = z.array(exerciseTemplateSchema);

export type ExerciseTemplates = z.infer<typeof exerciseTemplatesSchema>;
export type ExerciseTemplatesInput = z.input<typeof exerciseTemplatesSchema>;

export const joinExercisePayloadSchema = z.object({
    clientId: z.string(),
    exerciseTemplate: z.nullable(exerciseTemplateSchema),
});
export type JoinExercisePayload = z.infer<typeof joinExercisePayloadSchema>;
export type JoinExercisePayloadInput = z.input<
    typeof joinExercisePayloadSchema
>;
