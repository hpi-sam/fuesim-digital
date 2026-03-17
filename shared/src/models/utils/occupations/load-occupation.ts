import * as z from 'zod';
import { uuidSchema } from '../../../utils/index.js';

export const loadOccupationSchema = z.strictObject({
    type: z.literal('loadOccupation'),
    loadingActivityId: uuidSchema,
});

export type LoadOccupation = z.infer<typeof loadOccupationSchema>;

export const newLoadOccupation = (
    loadingActivityId: string
): LoadOccupation => ({
    type: 'loadOccupation',
    loadingActivityId,
});
