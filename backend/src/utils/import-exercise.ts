import type { StateExport } from 'fuesim-digital-shared';
import { ReducerError } from 'fuesim-digital-shared';
import type { ActiveExercise } from '../exercise/active-exercise.js';
import type { ExerciseFactory } from '../exercise/exercise-factory.js';
import { ValidationErrorWrapper } from './validation-error-wrapper.js';
import { ApiError } from './http.js';

export async function importExercise(
    importObject: StateExport,
    exerciseFactory: ExerciseFactory
): Promise<ActiveExercise> {
    try {
        return await exerciseFactory.fromFile(importObject);
    } catch (err) {
        if (err instanceof ValidationErrorWrapper) {
            throw new ApiError(
                `The validation of the import failed: ${err.errors}`
            );
        }
        if (err instanceof ReducerError) {
            throw new ApiError(`Error importing exercise: ${err.message}`);
        }
        throw err;
    }
}
