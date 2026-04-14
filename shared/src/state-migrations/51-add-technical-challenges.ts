import type { Task, TechnicalChallenge } from '../models/index.js';
import type { UUID } from '../utils/index.js';
import type { Migration } from './migration-functions.js';

export const addTechnicalChallenges51: Migration = {
    action: (intermediateState, action) => true,
    state: (state: any) => {
        const typedState = state as {
            technicalChallenges:
                | { [key: UUID]: TechnicalChallenge }
                | undefined;
            tasks: { [key: UUID]: Task } | undefined;
        };

        typedState.technicalChallenges = {};
        typedState.tasks = {};
    },
};
