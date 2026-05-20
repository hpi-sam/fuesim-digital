import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../../utils/uuid.js';

export const vehiclePositionSchema = z.strictObject({
    type: z.literal('vehicle'),
    vehicleId: uuidSchema,
});

export type VehiclePosition = Immutable<z.infer<typeof vehiclePositionSchema>>;

export function newVehiclePositionIn(vehicleId: UUID): VehiclePosition {
    return {
        type: 'vehicle',
        vehicleId,
    };
}
