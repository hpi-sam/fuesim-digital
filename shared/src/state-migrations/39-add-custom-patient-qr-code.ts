import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

interface Patient {
    id: UUID;
    customQRCode?: string;
}

export const addCustomPatientQRCode39: Migration = {
    action: (_, action) => {
        if ((action as { type: string }).type === '[Patient] Add patient') {
            (action as { patient: Patient }).patient.customQRCode = '';
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
            patient.customQRCode = '';
        });

        Object.values(typedState.hospitalPatients).forEach(
            (hospitalPatient) => {
                hospitalPatient.customQRCode = '';
            }
        );
    },
};
