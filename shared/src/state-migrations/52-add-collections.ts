import type { Migration } from './migration-functions.js';

export const addCollections52: Migration = {
    action: null,

    state: (state) => {
        const typedState = state as {
            selectedCollections: [];
        };

        typedState.selectedCollections = [];
    },
};
