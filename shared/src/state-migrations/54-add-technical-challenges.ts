import type { Migration } from './migration-functions.js';

export const addTechnicalChallenges54: Migration = {
    action: (intermediateState, action) => true,
    state: (state: any) => {
        const typedState = state as {
            technicalChallenges: object | undefined;
            tasks: object | undefined;
        };

        typedState.technicalChallenges = {};
        typedState.tasks = {};
    },
};
