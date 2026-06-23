import { z } from 'zod';
import type { Immutable } from 'immer';
import { radiogramStatusSchema } from './radiogram-status.js';

export const radiogramDoneStatus = z.strictObject({
    ...radiogramStatusSchema.shape,
    type: z.literal('doneRadiogramStatus'),
    publishTime: z.int().nonnegative(),
});
export type RadiogramDoneStatus = Immutable<
    z.infer<typeof radiogramDoneStatus>
>;

export function newRadiogramDoneStatus(
    publishTime: number
): RadiogramDoneStatus {
    return {
        type: 'doneRadiogramStatus',
        publishTime,
    };
}
