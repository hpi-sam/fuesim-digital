import { z } from 'zod';
import type { Immutable } from 'immer';
import {
    type HealthPoints,
    healthPointsSchema,
} from '../../../models/utils/health-points.js';
import { type UUID, uuidSchema } from '../../../utils/uuid.js';
import { patientHealthStateSchema } from '../../../models/patient-health-state.js';

export const patientUpdateSchema = z.strictObject({
    /**
     * The id of the patient
     */
    id: uuidSchema,
    /**
     * The new {@link HealthPoints} the patient should have
     */
    nextHealthPoints: healthPointsSchema,
    /**
     * The next {@link PatientHealthState} the patient should be in
     */
    nextStateId: patientHealthStateSchema.shape.id,
    /**
     * The new state time of the patient
     */
    nextStateTime: z.number(),
    /**
     * The new time a patient was treated overall
     */
    treatmentTime: z.number().nonnegative(),
});
export type PatientUpdate = Immutable<z.infer<typeof patientUpdateSchema>>;

export function newPatientUpdate(
    id: UUID,
    nextHealthPoints: HealthPoints,
    nextStateId: UUID,
    nextStateTime: number,
    treatmentTime: number
): PatientUpdate {
    return {
        id,
        nextHealthPoints,
        nextStateId,
        nextStateTime,
        treatmentTime,
    };
}
