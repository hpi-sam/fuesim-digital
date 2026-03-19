import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import type { ExerciseOccupation } from '../../models/index.js';
import { exerciseOccupationSchema } from '../../models/utils/occupations/exercise-occupation.js';
import { simulationEventSchema } from './simulation-event.js';

export const transferSpecificVehicleRequestEventSchema =
    simulationEventSchema.extend({
        type: z.literal('transferSpecificVehicleRequestEvent'),
        vehicleId: uuidSchema,
        transferInitiatingRegionId: uuidSchema.optional(),
        transferDestinationType: transferDestinationTypeSchema,
        transferDestinationId: uuidSchema,
        successorOccupation: exerciseOccupationSchema.optional(),
    });
export type TransferSpecificVehicleRequestEvent = z.infer<
    typeof transferSpecificVehicleRequestEventSchema
>;

export function newTransferSpecificVehicleRequestEvent(
    vehicleId: UUID,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    transferInitiatingRegionId?: UUID,
    successorOccupation?: ExerciseOccupation
): TransferSpecificVehicleRequestEvent {
    return {
        type: 'transferSpecificVehicleRequestEvent',
        vehicleId,
        transferInitiatingRegionId,
        transferDestinationType,
        transferDestinationId,
        successorOccupation,
    };
}
