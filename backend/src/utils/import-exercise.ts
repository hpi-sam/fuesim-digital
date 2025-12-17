import type { ExerciseKeys, StateExport } from 'digital-fuesim-manv-shared';
import { ReducerError } from 'digital-fuesim-manv-shared';
import type { HttpErrorMessage, HttpResponse } from 'http-handler/utils.js';
import type { ActiveExercise } from '../exercise/active-exercise.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { ValidationErrorWrapper } from './validation-error-wrapper.js';

export function importExercise(
    importObject: StateExport,
    ids: ExerciseKeys
): ActiveExercise | HttpResponse<HttpErrorMessage> {
    try {
        return ExerciseFactory.fromFile(importObject, ids);
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
