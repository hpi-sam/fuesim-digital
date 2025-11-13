import * as z from 'zod';

export const loadOccupationSchema = z.strictObject({
    type: z.literal('loadOccupation'),
    loadingActivityId: z.uuidv4(),
});

export type LoadOccupation = z.infer<typeof loadOccupationSchema>;
