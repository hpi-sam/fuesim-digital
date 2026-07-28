import { z } from 'zod';
import type { Immutable } from 'immer';
import { resourceDescriptionSchema } from '../utils/resource-description.js';
import type { UUID } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const personnelCountRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('personnelCountRadiogram'),
    personnelCount: resourceDescriptionSchema,
});
export type PersonnelCountRadiogram = Immutable<
    z.infer<typeof personnelCountRadiogramSchema>
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
