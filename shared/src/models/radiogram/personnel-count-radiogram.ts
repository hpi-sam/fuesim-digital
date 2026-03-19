import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { resourceDescriptionSchema } from '../utils/index.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/index.js';

export const personnelCountRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('personnelCountRadiogram'),
    personnelCount: resourceDescriptionSchema,
});
export type PersonnelCountRadiogram = z.infer<
    typeof personnelCountRadiogramSchema
>;

export function newPersonnelCountRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): PersonnelCountRadiogram {
    return {
        id,
        type: 'personnelCountRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        personnelCount: {},
    };
}
