import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const transferConnectionMissingEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('transferConnectionMissingEvent'),
    transferPointId: uuidSchema,
    key: z.string().optional(),
});

export type TransferConnectionMissingEvent = z.infer<
    typeof transferConnectionMissingEventSchema
>;

export function newTransferConnectionMissingEvent(
    transferPointId: UUID,
    key?: string
): TransferConnectionMissingEvent {
    return {
        type: 'transferConnectionMissingEvent',
        transferPointId,
        key,
    };
}
