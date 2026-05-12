import { z } from 'zod';
import type { Immutable } from 'immer';
import type { Transfer } from '../transfer.js';
import { transferSchema } from '../transfer.js';

export const transferPositionSchema = z.strictObject({
    type: z.literal('transfer'),
    transfer: transferSchema,
});

export type TransferPosition = Immutable<
    z.infer<typeof transferPositionSchema>
>;

export function newTransferPositionFor(transfer: Transfer): TransferPosition {
    return {
        type: 'transfer',
        transfer,
    };
}
