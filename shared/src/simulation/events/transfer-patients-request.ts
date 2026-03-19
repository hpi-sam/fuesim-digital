import { z } from 'zod';
import type { UUID, UUIDSet } from '../../utils/index.js';
import { uuidSchema, uuidSetSchema } from '../../utils/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import { simulationEventSchema } from './simulation-event.js';

export const transferPatientsRequestEventSchema = simulationEventSchema.extend({
    type: z.literal('transferPatientsRequestEvent'),
    vehicleType: z.string(),
    patientIds: uuidSetSchema,
    transferInitiatingRegionId: uuidSchema.optional(),
    transferDestinationType: transferDestinationTypeSchema,
    transferDestinationId: uuidSchema,
});
export type TransferPatientsRequestEvent = z.infer<
    typeof transferPatientsRequestEventSchema
>;

export function newTransferPatientsRequestEvent(
    vehicleType: string,
    patientIds: UUIDSet,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    transferInitiatingRegionId?: UUID
): TransferPatientsRequestEvent {
    return {
        type: 'transferPatientsRequestEvent',
        vehicleType,
        patientIds,
        transferDestinationType,
        transferDestinationId,
        transferInitiatingRegionId,
    };
}
