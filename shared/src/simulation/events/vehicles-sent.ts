import { z } from 'zod';
import type { VehicleResource } from '../../models/utils/rescue-resource.js';
import { vehicleResourceSchema } from '../../models/utils/rescue-resource.js';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const vehiclesSentEventSchema = simulationEventSchema.extend({
    type: z.literal('vehiclesSentEvent'),
    vehiclesSent: vehicleResourceSchema,
    destinationTransferPointId: uuidSchema,
    key: z.string().optional(),
});
export type VehiclesSentEvent = z.infer<typeof vehiclesSentEventSchema>;

export function newVehiclesSentEvent(
    vehiclesSent: VehicleResource,
    destinationTransferPointId: UUID,
    key?: string
): VehiclesSentEvent {
    return {
        type: 'vehiclesSentEvent',
        destinationTransferPointId,
        vehiclesSent,
        key,
    };
}
