import { z } from 'zod';
import { resourceDescriptionSchema } from '../utils/resource-description.js';
import type { UUID } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const vehicleOccupationsRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('vehicleOccupationsRadiogram'),
    occupations: resourceDescriptionSchema,
});
export type VehicleOccupationsRadiogram = z.infer<
    typeof vehicleOccupationsRadiogramSchema
>;
export function newVehicleOccupationsRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): VehicleOccupationsRadiogram {
    return {
        id,
        type: 'vehicleOccupationsRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        occupations: {},
    };
}
