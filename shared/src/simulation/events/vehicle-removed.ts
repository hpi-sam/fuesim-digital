import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const vehicleRemovedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
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
