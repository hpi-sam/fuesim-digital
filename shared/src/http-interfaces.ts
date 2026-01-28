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
    logoutstatus?: 'loggedout' | 'nosessionfound' | 'sessionexpired';
    loginfailure?: string;
    loginsuccess?: boolean;
}
