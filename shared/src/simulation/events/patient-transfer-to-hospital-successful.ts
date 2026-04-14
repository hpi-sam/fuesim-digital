import { z } from 'zod';
import {
    type PatientStatus,
    patientStatusSchema,
} from '../../models/utils/patient-status.js';
import { uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientTransferToHospitalSuccessfulEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('patientTransferToHospitalSuccessfulEvent'),
    patientCategory: patientStatusSchema,
    patientOriginSimulatedRegion: uuidSchema,
});
export type PatientTransferToHospitalSuccessfulEvent = z.infer<
    typeof patientTransferToHospitalSuccessfulEventSchema
>;

export function newPatientTransferToHospitalSuccessfulEvent(
    patientCategory: PatientStatus,
    patientOriginSimulatedRegion: string
): PatientTransferToHospitalSuccessfulEvent {
    return {
        type: 'patientTransferToHospitalSuccessfulEvent',
        patientCategory,
        patientOriginSimulatedRegion,
    };
}
