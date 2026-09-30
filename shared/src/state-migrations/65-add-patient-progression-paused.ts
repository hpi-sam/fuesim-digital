import type { Migration } from './migration-functions.js';

export const addPatientProgressionPaused65: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            configuration: {
                patientProgressionPaused?: boolean;
            };
        };

        typedState.configuration.patientProgressionPaused = false;
    },
};
