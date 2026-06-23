import type { Migration } from './migration-functions.js';

export const addEvalCriteria58: Migration = {
    action: null,

    state: (state: any) => {
        state.evalCriteria = {};
    },
};
