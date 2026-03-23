import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const vehicleArrivedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
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
