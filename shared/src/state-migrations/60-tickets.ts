import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface Patient {
    ticket: string;
}

type Action =
    | {
          type: '[Patient] Add patient';
          patient: Patient;
      }
    | { type: '[DUMMY]' };

export const tickets60: Migration = {
    action: (_, action) => {
        const typedAction = action as Action;
        switch (typedAction.type) {
            case '[Patient] Add patient':
                migratePatient(typedAction.patient);
                break;
            default:
                break;
        }

        return true;
    },
    state: (state) => {
        const typedState = state as {
            patients: {
                [key: UUID]: Patient;
            };
            hospitalPatients: {
                [key: UUID]: Patient;
            };
            configuration: {
                patientTicketMode?: 'freeText';
            };
        };

        typedState.configuration.patientTicketMode = 'freeText';
        Object.values(typedState.patients).forEach(migratePatient);
        Object.values(typedState.hospitalPatients).forEach(migratePatient);
    },
};

function migratePatient(patient: Patient) {
    patient.ticket = '';
}
