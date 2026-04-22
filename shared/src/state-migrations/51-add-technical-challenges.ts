import type { UUID } from '../utils/uuid.js';
import type { TechnicalChallenge } from '../models/technical-challenge/technical-challenge.js';
import type { Task } from '../models/task.js';
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
