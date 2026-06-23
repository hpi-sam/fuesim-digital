import { z } from 'zod';
import type { Immutable } from 'immer';

export const waitForTransferOccupationSchema = z.strictObject({
    type: z.literal('waitForTransferOccupation'),
});

export type WaitForTransferOccupation = Immutable<
    z.infer<typeof waitForTransferOccupationSchema>
>;

export function newWaitForTransferOccupation(): WaitForTransferOccupation {
    return {
        type: 'waitForTransferOccupation',
    };
}
