import { z } from 'zod';
import {
    newVehicleResource,
    vehicleResourceSchema,
} from '../utils/rescue-resource.js';
import type { UUID } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const resourceRequestRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('resourceRequestRadiogram'),
    resourcesPromised: z.boolean().optional(),
    requiredResource: vehicleResourceSchema,
    alreadyPromisedResource: vehicleResourceSchema.nullable(),
    canBeGranted: z.boolean(),
    resourceRequestKey: z.string(),
});
export type ResourceRequestRadiogram = z.infer<
    typeof resourceRequestRadiogramSchema
>;

export function newResourceRequestRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): ResourceRequestRadiogram {
    return {
        id,
        type: 'resourceRequestRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        requiredResource: newVehicleResource({}),
        alreadyPromisedResource: null,
        canBeGranted: true,
        resourceRequestKey: '',
    };
}
