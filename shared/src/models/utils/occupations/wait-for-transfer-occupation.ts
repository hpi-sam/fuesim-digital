import * as z from 'zod';

export const waitForTransferOccupationSchema = z.strictObject({
    type: z.literal('waitForTransferOccupation'),
});

export interface WaitForTransferOccupation {
    type: 'waitForTransferOccupation';
}
