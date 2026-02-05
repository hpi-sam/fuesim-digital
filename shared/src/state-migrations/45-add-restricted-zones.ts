import type { Migration } from './migration-functions.js';

export const addRestrictedZones45: Migration = {
    action: null,
    state: (state: any) => {
        state.restrictedZones = {};
        state.configuration.vehicleStatusHighlight = false;
        state.configuration.vehicleStatusInPatientStatusColor = false;
    },
};
