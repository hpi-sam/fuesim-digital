import type { Migration } from './migration-functions.js';

export const addCollections52: Migration = {
    action: null,

    state: (state) => {
        const typedState = state as {
            selectedCollection: null;
        };

        typedState.selectedCollection = null;
    },
};
