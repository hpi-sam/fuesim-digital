import { z } from 'zod';

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
    lastUsedAt: stringToDate,
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const exercisesSchema = z.array(exerciseSchema);
export type Exercises = z.infer<typeof exercisesSchema>;

export const exerciseTemplateSchema = z.object({
    trainerId: z.string(),
    lastExerciseCreatedAt: stringToDate,
    name: z.string(),
    description: z.string(),
});
export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;

export const exerciseTemplatesSchema = z.array(exerciseTemplateSchema);

export type ExerciseTemplates = z.infer<typeof exerciseTemplatesSchema>;
