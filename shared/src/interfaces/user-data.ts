import { z } from 'zod';
import { organisationIdSchema } from '../ids.js';
import { userDataSchema } from './user.js';

export const getUserDataDumpDataSchema = z.object({
    user: userDataSchema,
    sessions: z.strictObject({
        createdAt: z.date(),
        expiresAt: z.date(),
    }),
    organisations: z.strictObject({
        id: organisationIdSchema,
        name: z.string(),
        description: z.string(),
        userRole: z.string(),
    }),
    exercises: z.array(z.any()), // TODO: Why don't have zod schemas for these types? grrr...
    exerciseTemplates: z.array(z.any()),
    parallelExercises: z.array(z.any()),
});
