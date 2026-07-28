import { z } from 'zod';

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
