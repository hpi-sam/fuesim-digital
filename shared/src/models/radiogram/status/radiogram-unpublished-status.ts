import { z } from 'zod';
import type { Immutable } from 'immer';
import { radiogramStatusSchema } from './radiogram-status.js';

export const radiogramUnpublishedStatus = z.strictObject({
    ...radiogramStatusSchema.shape,
    type: z.literal('unpublishedRadiogramStatus'),
});
export type RadiogramUnpublishedStatus = Immutable<
    z.infer<typeof radiogramUnpublishedStatus>
>;

export function newRadiogramUnpublishedStatus(): RadiogramUnpublishedStatus {
    return {
        type: 'unpublishedRadiogramStatus',
    };
}
