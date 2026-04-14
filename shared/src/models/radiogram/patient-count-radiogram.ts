import { z } from 'zod';
import { patientStatusSchema } from '../utils/patient-status.js';
import type { UUID } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const patientCountRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('patientCountRadiogram'),
    patientCount: z.record(patientStatusSchema, z.int().nonnegative()),
});
export type PatientCountRadiogram = z.infer<typeof patientCountRadiogramSchema>;

export function newPatientCountRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): PatientCountRadiogram {
    return {
        id,
        type: 'patientCountRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        patientCount: {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        },
    };
}
