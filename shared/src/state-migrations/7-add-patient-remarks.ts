import type { Action } from '../store/action-reducer.js';
import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addPatientRemarks7: Migration = {
    action: (_intermediaryState, action) => {
        if ((action as Action).type === '[Patient] Add patient') {
            (action as { patient: { remarks: string } }).patient.remarks = '';
        }
        return true;
    },
    state: (state) => {
        const typedState = state as {
            patients: { [patientId: UUID]: { remarks: string } };
        };
        Object.values(typedState.patients).forEach((patient) => {
            patient.remarks = '';
        });
    },
};
