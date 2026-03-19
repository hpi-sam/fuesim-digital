import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const vehicleArrivedEventSchema = simulationEventSchema.extend({
    type: z.literal('vehicleArrivedEvent'),
    vehicleId: uuidSchema,
    arrivalTime: z.int().nonnegative(),
});

export type VehicleArrivedEvent = z.infer<typeof vehicleArrivedEventSchema>;

export function newVehicleArrivedEvent(
    vehicleId: UUID,
    arrivalTime: number
): VehicleArrivedEvent {
    return {
        type: 'vehicleArrivedEvent',
        vehicleId,
        arrivalTime,
    };
}
