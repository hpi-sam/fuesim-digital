import type { Migration } from './migration-functions.js';

export const addAutojoinViewport47: Migration = {
    action: null,
    state: (state: any) => {
        state.autojoinViewportId = null;
        state.clientNames = [];
    },
};
