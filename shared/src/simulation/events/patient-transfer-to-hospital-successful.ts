import { z } from 'zod';
import { type PatientStatus, patientStatusSchema } from '../../models/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientTransferToHospitalSuccessfulEventSchema =
    simulationEventSchema.extend({
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
