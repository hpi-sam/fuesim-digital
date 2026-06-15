import { Migration } from './migration-functions.js';

export const addEvalCriteria57: Migration = {
    action: null,

    state: (state: any) => {
        state.evalCriteria = {};
    },
};
