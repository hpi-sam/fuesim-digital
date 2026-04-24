import { z } from 'zod';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import {
    type ResourceDescription,
    resourceDescriptionSchema,
} from '../../models/utils/resource-description.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import {
    type ExerciseOccupation,
    exerciseOccupationSchema,
} from '../../models/utils/occupations/exercise-occupation.js';
import { simulationEventSchema } from './simulation-event.js';

export const transferVehiclesRequestEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('transferVehiclesRequestEvent'),
    requestedVehicles: resourceDescriptionSchema,
    transferInitiatingRegionId: uuidSchema.optional(),
    transferDestinationType: transferDestinationTypeSchema,
    transferDestinationId: uuidSchema,
    successorOccupation: exerciseOccupationSchema.optional(),
    key: z.string().optional(),
});

export type TransferVehiclesRequestEvent = z.infer<
    typeof transferVehiclesRequestEventSchema
>;

export function newTransferVehiclesRequestEvent(
    requestedVehicles: ResourceDescription,
    transferDestinationType: TransferDestination,
    transferDestinationId: UUID,
    transferInitiatingRegionId?: UUID,
    key?: string,
    successorOccupation?: ExerciseOccupation
): TransferVehiclesRequestEvent {
    return {
        type: 'transferVehiclesRequestEvent',
        requestedVehicles,
        transferDestinationType,
        transferDestinationId,
        transferInitiatingRegionId,
        key,
        successorOccupation,
    };
}
