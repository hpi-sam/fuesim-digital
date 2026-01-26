import type { StateExport } from 'digital-fuesim-manv-shared';
import { ReducerError } from 'digital-fuesim-manv-shared';
import type { HttpErrorMessage, HttpResponse } from 'utils/http.js';
import type { ActiveExercise } from '../exercise/active-exercise.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { ValidationErrorWrapper } from './validation-error-wrapper.js';

export function importExercise(
    importObject: StateExport
): ActiveExercise | HttpResponse<HttpErrorMessage> {
    try {
        return ExerciseFactory.fromFile(importObject);
    } catch (err) {
        if (err instanceof ValidationErrorWrapper) {
            return {
                statusCode: 400,
                body: {
                    message: `The validation of the import failed: ${err.errors}`,
                },
            };
        }
        if (err instanceof ReducerError) {
            return {
                statusCode: 400,
                body: {
                    message: `Error importing exercise: ${err.message}`,
                },
            };
        }
        throw err;
    }
}
