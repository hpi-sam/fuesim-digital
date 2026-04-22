import type { Migration } from './migration-functions.js';

export const addMeasures52: Migration = {
    action: null,

    state: (state: any) => {
        state.measures = {};
        state.measureTemplates = {};
        state.drawings = {};
    },
};
