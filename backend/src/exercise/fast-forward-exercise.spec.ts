import { createTestEnvironment } from '../test/utils.js';
import { fastForwardExercise } from './fast-forward-exercise.js';

describe('fastForwardExercise', () => {
    const environment = createTestEnvironment();

    it('advances currentTime and starts the exercise', async () => {
        const exercise =
            await environment.services.exerciseService.createExerciseFromBlank();

        fastForwardExercise(exercise, 5000, 'running');

        expect(exercise.exercise.currentStateString.currentTime).toBe(5000);
        expect(exercise.exercise.currentStateString.currentStatus).toBe(
            'running'
        );

        exercise.pause();
    });

    it('advances currentTime and leaves the exercise paused', async () => {
        const exercise =
            await environment.services.exerciseService.createExerciseFromBlank();

        fastForwardExercise(exercise, 3000, 'paused');

        expect(exercise.exercise.currentStateString.currentTime).toBe(3000);
        expect(exercise.exercise.currentStateString.currentStatus).toBe(
            'paused'
        );
    });
});
