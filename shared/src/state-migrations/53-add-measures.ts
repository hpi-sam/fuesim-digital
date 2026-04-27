import type { Migration } from './migration-functions.js';

export const addMeasures53: Migration = {
    action: null,

    state: (state: any) => {
        state.measures = {};
        state.measureTemplates = {};
        state.drawings = {};
    },
};
