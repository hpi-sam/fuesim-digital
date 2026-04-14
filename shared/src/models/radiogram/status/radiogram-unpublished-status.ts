import { z } from 'zod';
import { radiogramStatusSchema } from './radiogram-status.js';

export const radiogramUnpublishedStatus = z.strictObject({
    ...radiogramStatusSchema.shape,
    type: z.literal('unpublishedRadiogramStatus'),
});
export type RadiogramUnpublishedStatus = z.infer<
    typeof radiogramUnpublishedStatus
>;

export function newRadiogramUnpublishedStatus(): RadiogramUnpublishedStatus {
    return {
        type: 'unpublishedRadiogramStatus',
    };
}
