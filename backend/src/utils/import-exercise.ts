import type { StateExport } from 'digital-fuesim-manv-shared';
import { ApiError, ReducerError } from 'digital-fuesim-manv-shared';
import type { ActiveExercise } from '../exercise/active-exercise.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { ValidationErrorWrapper } from './validation-error-wrapper.js';

export function importExercise(importObject: StateExport): ActiveExercise {
    try {
        return ExerciseFactory.fromFile(importObject);
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
