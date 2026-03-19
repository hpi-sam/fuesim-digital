import { z } from 'zod';
import type { UUID, UUIDSet } from '../../utils/index.js';
import { uuidSchema, uuidSetSchema } from '../../utils/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';

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
