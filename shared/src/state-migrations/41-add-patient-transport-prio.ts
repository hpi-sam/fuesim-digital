import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface Patient {
    hasTransportPriority: boolean;
}

export const addPatientTransportPriority41: Migration = {
    action: (_, action) => {
        if ((action as { type: string }).type === '[Patient] Add patient') {
            (action as { patient: Patient }).patient.hasTransportPriority =
                false;
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            patients: {
                [patientId: UUID]: Patient;
            };
            hospitalPatients: {
                [hospitalPatientId: UUID]: Patient;
            };
        };

        Object.values(typedState.patients).forEach((patient) => {
            patient.hasTransportPriority = false;
        });

        Object.values(typedState.hospitalPatients).forEach(
            (hospitalPatient) => {
                hospitalPatient.hasTransportPriority = false;
            }
        );
    },
};
