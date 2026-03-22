import { z } from 'zod';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import { type UUIDSet, uuidSetSchema } from '../../utils/uuid-set.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';

export const transferPatientsInSpecificVehicleRequestEventSchema =
    z.strictObject({
        type: z.literal('transferPatientsInSpecificVehicleRequestEvent'),
        patientIds: uuidSetSchema,
        vehicleId: uuidSchema,
        transferInitiatingRegionId: uuidSchema.optional(),
        transferDestinationType: transferDestinationTypeSchema,
        transferDestinationId: uuidSchema,
    });
export type TransferPatientsInSpecificVehicleRequestEvent = z.infer<
    typeof transferPatientsInSpecificVehicleRequestEventSchema
>;

export function newTransferPatientsInSpecificVehicleRequestEvent(
    patientIds: UUIDSet,
    vehicleId: UUID,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    transferInitiatingRegionId?: UUID
): TransferPatientsInSpecificVehicleRequestEvent {
    return {
        type: 'transferPatientsInSpecificVehicleRequestEvent',
        patientIds,
        vehicleId,
        transferDestinationType,
        transferDestinationId,
        transferInitiatingRegionId,
    };
}
