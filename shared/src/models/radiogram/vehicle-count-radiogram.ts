import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const vehicleCountRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('vehicleCountRadiogram'),
    vehicleCount: z.record(z.string(), z.int().nonnegative()),
});
export type VehicleCountRadiogram = z.infer<typeof vehicleCountRadiogramSchema>;

export function newVehicleCountRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): VehicleCountRadiogram {
    return {
        id,
        type: 'vehicleCountRadiogram',
        simulatedRegionId,
        status,
        informationRequestKey,
        informationAvailable: false,
        vehicleCount: {},
    };
}
