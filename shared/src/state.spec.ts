import { ExerciseState } from './state.js';
import { validateExerciseState } from './store/index.js';
import type { ParticipantKey } from './exercise-keys.js';

describe('ExerciseState', () => {
    // If this fails, either the created state is invalid, or a validator is incorrect/missing in a model.
    it('creates a valid state', () => {
        const exercise = ExerciseState.create('123456' as ParticipantKey);
        const validation = validateExerciseState(exercise);
        expect(validation.length).toBe(0);
    });
});
