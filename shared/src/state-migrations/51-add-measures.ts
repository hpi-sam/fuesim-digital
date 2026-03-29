import type { Migration } from './migration-functions.js';

export const addMeasures51: Migration = {
    action: null,

    state: (state: any) => {
        state.measures = {};
        state.measureTemplates = {};
    },
};
