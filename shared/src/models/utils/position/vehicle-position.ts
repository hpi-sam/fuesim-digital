import * as z from 'zod';
import type { UUID } from '../../../index.js';

export const vehiclePositionSchema = z.strictObject({
    type: z.literal('vehicle'),
    vehicleId: z.uuidv4(),
});

export type VehiclePosition = z.infer<typeof vehiclePositionSchema>;

export const newVehiclePositionIn = (vehicleId: UUID): VehiclePosition => ({
    type: 'vehicle',
    vehicleId,
});
