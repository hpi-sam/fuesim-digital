import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const newPatientDataRequestedRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('newPatientDataRequestedRadiogram'),
});
export type NewPatientDataRequestedRadiogram = z.infer<
    typeof newPatientDataRequestedRadiogramSchema
>;

export function newNewPatientDataRequestedRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    status: ExerciseRadiogramStatus
): NewPatientDataRequestedRadiogram {
    return {
        id,
        type: 'newPatientDataRequestedRadiogram',
        simulatedRegionId,
        status,
        informationRequestKey: null,
        informationAvailable: false,
    };
}
