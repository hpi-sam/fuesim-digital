import type { Migration } from './migration-functions.js';

export const addEvalCriteria59: Migration = {
    action: null,

    state: (state: any) => {
        state.evalCriteria = {};
    },
};
