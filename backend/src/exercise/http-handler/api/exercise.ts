import type {
    ExerciseIds,
    ExerciseTimeline,
    StateExport,
} from 'digital-fuesim-manv-shared';
import { isEmpty } from 'lodash-es';
import { UserReadableIdGenerator } from '../../../utils/user-readable-id-generator.js';
import { ActiveExercise } from '../../exercise-wrapper.js';
import type { HttpResponse } from '../utils.js';
import { importExercise } from '../../../utils/import-exercise.js';
import { UnknownExerciseError } from './../../../database/services/exercise-service.js';
import type { ExerciseService } from './../../../database/services/exercise-service.js';
import { ExerciseFactory } from './../../../exercise/exercise-factory.js';

export async function postExercise(
    exerciseService: ExerciseService,
    importObject: StateExport
): Promise<HttpResponse<ExerciseIds>> {
    try {
        const participantId = UserReadableIdGenerator.generateId();
        const trainerId = UserReadableIdGenerator.generateId(8);
        const newExerciseOrError = isEmpty(importObject)
            ? ExerciseFactory.fromBlank({ participantId, trainerId })
            : importExercise(importObject, {
                  participantId,
                  trainerId,
              });
        if (!(newExerciseOrError instanceof ActiveExercise)) {
            return newExerciseOrError;
        }

        await exerciseService.loadExercise(newExerciseOrError, {
            participantId,
            trainerId,
        });

        return {
            statusCode: 201,
            body: {
                participantId,
                trainerId,
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
    exerciseId: string,
    exerciseService: ExerciseService
): HttpResponse {
    const exerciseExists = exerciseService.hasExerciseId(exerciseId);
    return {
        statusCode: exerciseExists ? 200 : 404,
        body: undefined,
    };
}

export async function deleteExercise(
    exerciseId: string,
    exerciseService: ExerciseService
): Promise<HttpResponse> {
    if (exerciseService.getRoleFromId(exerciseId) !== 'trainer') {
        return {
            statusCode: 403,
            body: {
                message:
                    'Exercises can only be deleted by using their trainer id',
            },
        };
    }
    try {
        await exerciseService.deleteExercise(exerciseId);
        return {
            statusCode: 204,
            body: undefined,
        };
    } catch (err) {
        if (err instanceof UnknownExerciseError) {
            return {
                statusCode: 404,
                body: {
                    message: `Exercise with id '${exerciseId}' was not found`,
                },
            };
        }

        throw err;
    }
}

export async function getExerciseHistory(
    exerciseId: string,
    exerciseService: ExerciseService
): Promise<HttpResponse<ExerciseTimeline>> {
    try {
        const timeline = await exerciseService.getTimeline(exerciseId);
        return {
            statusCode: 200,
            body: timeline,
        };
    } catch (err) {
        if (err instanceof UnknownExerciseError) {
            return {
                statusCode: 404,
                body: {
                    message: `Exercise with id '${exerciseId}' was not found`,
                },
            };
        }
        throw err;
    }
}
