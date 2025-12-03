import type { ExerciseIds, CompleteExport } from 'digital-fuesim-manv-shared';
import {
    migrateCompleteExport,
    ReducerError,
    validateExerciseExport,
} from 'digital-fuesim-manv-shared';
import type { DatabaseService } from '../database/services/database-service.js';
import { ExerciseWrapper } from '../exercise/exercise-wrapper.js';
import type { HttpResponse } from '../exercise/http-handler/utils.js';

export async function importExercise(
    importObject: CompleteExport,
    ids: ExerciseIds,
    databaseService: DatabaseService
): Promise<ExerciseWrapper | HttpResponse<ExerciseIds>> {
    const migratedImportObject = migrateCompleteExport(importObject);
    const validationErrors = validateExerciseExport(migratedImportObject);
    if (validationErrors.length > 0) {
        return {
            statusCode: 400,
            body: {
                message: `The validation of the import failed: ${validationErrors}`,
            },
        };
    }
    try {
        return await ExerciseWrapper.importFromFile(
            databaseService,
            migratedImportObject,
            {
                participantId: ids.participantId,
                trainerId: ids.trainerId,
            }
        );
    } catch (e: unknown) {
        if (e instanceof ReducerError) {
            return {
                statusCode: 400,
                body: {
                    message: `Error importing exercise: ${e.message}`,
                },
            };
        }
        throw e;
    }
}
