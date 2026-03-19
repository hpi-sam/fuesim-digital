import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const vehicleRemovedEventSchema = simulationEventSchema.extend({
    type: z.literal('vehicleRemovedEvent'),
    vehicleId: uuidSchema,
});
export type VehicleRemovedEvent = z.infer<typeof vehicleRemovedEventSchema>;

export function newVehicleRemovedEvent(vehicleId: UUID): VehicleRemovedEvent {
    return {
        type: 'vehicleRemovedEvent',
        vehicleId,
    };
}
