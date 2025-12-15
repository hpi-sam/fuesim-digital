import type { ExerciseIds, StateExport } from 'digital-fuesim-manv-shared';
import { ReducerError } from 'digital-fuesim-manv-shared';
import type { ActiveExercise } from '../exercise/exercise-wrapper.js';
import type { HttpResponse } from '../exercise/http-handler/utils.js';
import { ExerciseFactory } from '../exercise/exercise-factory.js';
import { ValidationErrorWrapper } from './validation-error-wrapper.js';

export function importExercise(
    importObject: StateExport,
    ids: ExerciseIds
): ActiveExercise | HttpResponse<ExerciseIds> {
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
