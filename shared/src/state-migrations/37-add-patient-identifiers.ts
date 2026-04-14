import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

interface Patient {
    id: UUID;
    identifier?: string;
}

export const addPatientIdentifiers37: Migration = {
    action: (_, action) => {
        if ((action as { type: string }).type === '[Patient] Add patient') {
            (action as { patient: Patient }).patient.identifier = '';
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
            configuration: {
                patientIdentifierPrefix?: string;
            };
            patientCounter?: number;
        };

        typedState.patientCounter ??= 0;

        typedState.configuration.patientIdentifierPrefix ??= '';

        Object.values(typedState.patients)
            .sort((a, b) => stringCompare(a.id, b.id))
            .forEach((patient) => {
                typedState.patientCounter!++;
                const paddedCounter = String(
                    typedState.patientCounter
                ).padStart(4, '0');
                patient.identifier = `${typedState.configuration.patientIdentifierPrefix}${paddedCounter}`;
            });

        Object.values(typedState.hospitalPatients).forEach(
            (hospitalPatient) => {
                hospitalPatient.identifier = '';
            }
        );
    },
};

/**
 * At the time of writing, this is identical to `shared/src/utils/string-compare.ts`.
 * However, we want migrations to be stable and thus avoid dependencies outside the `src/state-migrations` tree.
 */
function stringCompare(a: string, b: string) {
    if (a < b) return -1;
    else if (a > b) return 1;
    return 0;
}
