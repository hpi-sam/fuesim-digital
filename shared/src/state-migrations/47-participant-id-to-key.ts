import type { Migration } from './migration-functions.js';

export const participantIdToKey47: Migration = {
    action: null,

    state: (state) => {
        const typedState = state as {
            participantId?: string;
            participantKey?: string;
        };

        typedState.participantKey = typedState.participantId;
        delete typedState.participantId;
    },
};
