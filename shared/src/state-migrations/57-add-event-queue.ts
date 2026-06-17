import type { Migration } from './migration-functions.js';

export const addEventQueue57: Migration = {
    action: null,

    state: (state: any) => {
        state.technicalChallengeEventQueue = {
            events: [],
            indices: new Map(),
        };
    },
};
