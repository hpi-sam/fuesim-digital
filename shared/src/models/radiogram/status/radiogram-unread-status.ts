import { z } from 'zod';
import type { Immutable } from 'immer';
import { radiogramStatusSchema } from './radiogram-status.js';

export const radiogramUnreadStatus = z.strictObject({
    ...radiogramStatusSchema.shape,
    type: z.literal('unreadRadiogramStatus'),
    publishTime: z.int().nonnegative(),
});
export type RadiogramUnreadStatus = Immutable<
    z.infer<typeof radiogramUnreadStatus>
>;

export function newRadiogramUnreadStatus(
    publishTime: number
): RadiogramUnreadStatus {
    return {
        type: 'unreadRadiogramStatus',
        publishTime,
    };
}
