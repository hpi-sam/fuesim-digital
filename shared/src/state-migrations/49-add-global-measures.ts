import type { Migration } from './migration-functions.js';

export const addGlobalMeasures49: Migration = {
    action: null,

    state: (state: any) => {
        state.measures = {};
        state.measureTemplates = {};
    },
};
