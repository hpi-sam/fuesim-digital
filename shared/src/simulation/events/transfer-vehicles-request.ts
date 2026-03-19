import { z } from 'zod';
import type {
    ExerciseOccupation,
    ResourceDescription,
} from '../../models/index.js';
import {
    resourceDescriptionSchema,
    exerciseOccupationSchema,
} from '../../models/index.js';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import type { TransferDestination } from '../utils/transfer-destination.js';
import { transferDestinationTypeSchema } from '../utils/transfer-destination.js';
import { simulationEventSchema } from './simulation-event.js';

export const transferVehiclesRequestEventSchema = simulationEventSchema.extend({
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
