import * as z from 'zod';
import type { UUID } from '../../../index.js';
import { uuidSchema } from '../../../index.js';

export const vehiclePositionSchema = z.strictObject({
    type: z.literal('vehicle'),
    vehicleId: uuidSchema,
});

export type VehiclePosition = z.infer<typeof vehiclePositionSchema>;

export const newVehiclePositionIn = (vehicleId: UUID): VehiclePosition => ({
    type: 'vehicle',
    vehicleId,
});
