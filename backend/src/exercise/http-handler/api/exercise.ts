import type { ExerciseTimeline, StateExport } from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { UserReadableIdGenerator } from '../../../utils/user-readable-id-generator.js';
import { ActiveExercise } from '../../active-exercise.js';
import type { HttpErrorMessage, HttpResponse } from '../utils.js';
import { importExercise } from '../../../utils/import-exercise.js';
import { UnknownExerciseError } from './../../../database/services/exercise-service.js';
import type { ExerciseService } from './../../../database/services/exercise-service.js';
import { ExerciseFactory } from './../../../exercise/exercise-factory.js';

export async function postExercise(
    exerciseService: ExerciseService,
    importObject: StateExport
): Promise<
    HttpResponse<
        HttpErrorMessage | { participantId: string; trainerId: string }
    >
> {
    try {
        const participantKey = UserReadableIdGenerator.generateId();
        const trainerKey = UserReadableIdGenerator.generateId(8);
        const newExerciseOrError = isEmpty(importObject)
            ? ExerciseFactory.fromBlank({ participantKey, trainerKey })
            : importExercise(importObject, {
                  participantKey,
                  trainerKey,
              });
        if (!(newExerciseOrError instanceof ActiveExercise)) {
            return newExerciseOrError;
        }

        await exerciseService.loadExercise(newExerciseOrError);

        return {
            statusCode: 201,
            body: {
                participantId: participantKey,
                trainerId: trainerKey,
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
): HttpResponse {
    const exerciseExists = exerciseService.hasExerciseKey(exerciseKey);
    return {
        statusCode: exerciseExists ? 200 : 404,
        body: undefined,
    };
}

export async function deleteExercise(
    exerciseKey: string,
    exerciseService: ExerciseService
): Promise<HttpResponse> {
    if (exerciseService.getRoleFromKey(exerciseKey) !== 'trainer') {
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
