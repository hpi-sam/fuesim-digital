import {
    type ExerciseExistsInput,
    exerciseExistsSchema,
    type ExerciseAccessIds,
    type ExerciseTimeline,
    type StateExport,
} from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { ActiveExercise } from '../../exercise/active-exercise.js';
import type { HttpErrorMessage, HttpResponse } from '../utils.js';
import { importExercise } from '../../../utils/import-exercise.js';
import { isExerciseKey, isTrainerKey } from '../../exercise-keys.js';
import { UnknownExerciseError } from './../../../database/services/exercise-service.js';
import type { ExerciseService } from './../../../database/services/exercise-service.js';
import { ExerciseFactory } from './../../../exercise/exercise-factory.js';

export async function postExercise(
    exerciseService: ExerciseService,
    importObject: StateExport
): Promise<HttpResponse<ExerciseAccessIds | HttpErrorMessage>> {
    try {
        const newExerciseOrError = isEmpty(importObject)
            ? ExerciseFactory.fromBlank()
            : importExercise(importObject);
        if (!(newExerciseOrError instanceof ActiveExercise)) {
            return newExerciseOrError;
        }

        await exerciseService.loadExercise(newExerciseOrError);

        return {
            statusCode: 201,
            body: {
                participantId: newExerciseOrError.getExercise().participantId,
                trainerId: newExerciseOrError.getExercise().trainerId,
            },
        };
    } catch (error: unknown) {
        if (error instanceof RangeError) {
            return {
                statusCode: 503,
                body: {
                    message: 'No ids available.',
                },
            };
        }
        throw error;
    }
}

export function getExercise(
    exerciseKey: string,
    exerciseService: ExerciseService
): HttpResponse<ExerciseExistsInput | HttpErrorMessage | undefined> {
    if (!isExerciseKey(exerciseKey)) {
        return {
            statusCode: 400,
            body: {
                message: `The provided exercise key '${exerciseKey}' is invalid.`,
            },
        };
    }

    const exercise = exerciseService.getExerciseByKey(exerciseId);
    return {
        statusCode: exercise ? 200 : 404,
        body: exercise
            ? exerciseExistsSchema.parse({ isTemplate: !!exercise.template })
            : undefined,
    };
}

export async function deleteExercise(
    exerciseKey: string,
    exerciseService: ExerciseService
): Promise<HttpResponse> {
    if (!isTrainerKey(exerciseKey)) {
        return {
            statusCode: 403,
            body: {
                message:
                    'Exercises can only be deleted by using their trainer id',
            },
        };
    }
    try {
        await exerciseService.deleteExercise(exerciseKey);
        return {
            statusCode: 204,
            body: undefined,
        };
    } catch (err) {
        if (err instanceof UnknownExerciseError) {
            return {
                statusCode: 404,
                body: {
                    message: `Exercise with id '${exerciseKey}' was not found`,
                },
            };
        }

        throw err;
    }
}

export async function getExerciseHistory(
    exerciseKey: string,
    exerciseService: ExerciseService
): Promise<HttpResponse<ExerciseTimeline>> {
    if (!isExerciseKey(exerciseKey)) {
        return {
            statusCode: 400,
            body: {
                message: `The provided exercise key '${exerciseKey}' is invalid.`,
            },
        };
    }

    try {
        const timeline = await exerciseService.getTimeline(exerciseKey);
        return {
            statusCode: 200,
            body: timeline,
        };
    } catch (err) {
        if (err instanceof UnknownExerciseError) {
            return {
                statusCode: 404,
                body: {
                    message: `Exercise with id '${exerciseKey}' was not found`,
                },
            };
        }
        throw err;
    }
}
