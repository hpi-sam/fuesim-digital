import { z } from 'zod';

export class ApiError extends Error {
    public statusCode = 400;
}
export class NotFoundError extends ApiError {
    public override statusCode = 404;
    public constructor() {
        super(`Object does not exist`);
    }
}
export class PermissionDeniedError extends ApiError {
    public override statusCode = 403;
    public constructor() {
        super('You have no permission for this operation.');
    }
}
export interface ExerciseKeys {
    readonly participantKey: string;
    readonly trainerKey: string;
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
    participantId: z.string(),
    trainerId: z.string(),
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
    trainerId: z.string(),
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
