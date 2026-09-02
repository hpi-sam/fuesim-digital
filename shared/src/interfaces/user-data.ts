import { z } from 'zod';
import { organisationIdSchema } from '../ids.js';
import { userDataSchema } from './user.js';
import { stringToDate } from './utils.js';

export const getUserDataDumpDataSchema = z.object({
    user: userDataSchema,
    sessions: z.array(
        z.strictObject({
            createdAt: stringToDate,
            expiresAt: stringToDate,
        })
    ),
    organisations: z.array(
        z.strictObject({
            id: organisationIdSchema,
            name: z.string(),
            description: z.string(),
            userRole: z.string(),
        })
    ),
    exercises: z.array(z.any()),
    exerciseTemplates: z.array(z.any()),
    parallelExercises: z.array(z.any()),
});
export type GetUserDataDumpDataOutput = z.output<
    typeof getUserDataDumpDataSchema
>;
export type GetUserDataDumpDataInput = z.input<
    typeof getUserDataDumpDataSchema
>;
