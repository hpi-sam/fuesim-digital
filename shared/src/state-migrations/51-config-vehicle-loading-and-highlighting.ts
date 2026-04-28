import type { Migration } from './migration-functions.js';

export const configVehicleLoadingAndHighlighting51: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            configuration: {
                highlightRelatedElements?: 'all' | 'off' | 'trainersOnly';
                participantLoadAllEnabled?: boolean;
            };
        };

        typedState.configuration.highlightRelatedElements = 'trainersOnly';
        typedState.configuration.participantLoadAllEnabled = false;
    },
};
