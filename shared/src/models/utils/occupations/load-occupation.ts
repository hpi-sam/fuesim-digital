import { z } from 'zod';
import { uuidSchema } from '../../../utils/uuid.js';

export const loadOccupationSchema = z.strictObject({
    type: z.literal('loadOccupation'),
    loadingActivityId: uuidSchema,
});

export type LoadOccupation = z.infer<typeof loadOccupationSchema>;

export function newLoadOccupation(loadingActivityId: string): LoadOccupation {
    return {
        type: 'loadOccupation',
        loadingActivityId,
    };
}
