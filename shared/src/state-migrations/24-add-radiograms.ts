import type { ExerciseRadiogram } from '../models/radiogram/exercise-radiogram.js';
import type { UUID } from '../utils/uuid.js';
import type { Migration } from './migration-functions.js';

export const addRadiograms24: Migration = {
    action: null,
    state: (state) => {
        const typedState = state as {
            radiograms?: { [key: UUID]: ExerciseRadiogram };
        };
        typedState.radiograms = {};
    },
};
