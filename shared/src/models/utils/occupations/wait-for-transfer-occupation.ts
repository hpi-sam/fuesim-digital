import { z } from 'zod';

export const waitForTransferOccupationSchema = z.strictObject({
    type: z.literal('waitForTransferOccupation'),
});

export type WaitForTransferOccupation = z.infer<
    typeof waitForTransferOccupationSchema
>;

export function newWaitForTransferOccupation(): WaitForTransferOccupation {
    return {
        type: 'waitForTransferOccupation',
    };
}
