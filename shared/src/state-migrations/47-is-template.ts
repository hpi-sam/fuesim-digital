import type { Migration } from './migration-functions.js';

export const isTemplate47: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            isTemplate?: boolean;
        };

        typedState.isTemplate = false;
    },
};
