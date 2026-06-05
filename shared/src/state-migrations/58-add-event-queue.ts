import type { Migration } from './migration-functions.js';

export const addEventQueue58: Migration = {
    action: null,

    state: (state: any) => {
        state.technicalChallengeEventQueue = {
            events: [],
            indices: new Map(),
        };
    },
};
