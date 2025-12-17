import type { ExercisesInput } from 'digital-fuesim-manv-shared';
import { exercisesSchema } from 'digital-fuesim-manv-shared';
import type { HttpResponse } from '../utils.js';
import type { ExerciseManagerService } from '../../database/services/exercise-manager-service.js';

export async function getExercises(
    exerciseManagerService: ExerciseManagerService
): Promise<HttpResponse<ExercisesInput>> {
    const exercises = await exerciseManagerService.getAllExercisesOfOwner();
    return {
        statusCode: 200,
        body: exercisesSchema.encode(exercises),
    };
}
