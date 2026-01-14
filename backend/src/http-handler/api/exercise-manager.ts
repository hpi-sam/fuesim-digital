import type {
    ExercisesInput,
    ExerciseTemplatesInput,
    ExerciseTemplateInput,
} from 'digital-fuesim-manv-shared';
import {
    exercisesSchema,
    exerciseTemplateCreateSchema,
    exerciseTemplateSchema,
    exerciseTemplatesSchema,
} from 'digital-fuesim-manv-shared';
import type { HttpErrorMessage, HttpResponse } from '../utils.js';
import type { ExerciseManagerService } from '../../database/services/exercise-manager-service.js';
import type { ExerciseService } from '../../database/services/exercise-service.js';

export async function getExercises(
    exerciseManagerService: ExerciseManagerService
): Promise<HttpResponse<ExercisesInput>> {
    const exercises = await exerciseManagerService.getAllExercisesOfOwner();
    return {
        statusCode: 200,
        body: exercisesSchema.encode(exercises),
    };
}

export async function getExerciseTemplates(
    exerciseManagerService: ExerciseManagerService
): Promise<HttpResponse<ExerciseTemplatesInput>> {
    const templates =
        await exerciseManagerService.getAllExerciseTemplatesOfOwner();
    return {
        statusCode: 200,
        body: exerciseTemplatesSchema.encode(templates),
    };
}

export async function postExerciseTemplate(
    exerciseManagerService: ExerciseManagerService,
    exerciseService: ExerciseService,
    data: object
): Promise<HttpResponse<ExerciseTemplateInput | HttpErrorMessage>> {
    const parsedData = exerciseTemplateCreateSchema.parse(data);
    const exerciseTemplate =
        await exerciseManagerService.createExerciseTemplate(
            parsedData,
            exerciseService
        );

    return {
        statusCode: 201,
        body: exerciseTemplateSchema.encode(exerciseTemplate),
    };
}

export async function patchExerciseTemplate(
    exerciseManagerService: ExerciseManagerService,
    id: string,
    data: object
): Promise<HttpResponse<ExerciseTemplateInput | HttpErrorMessage>> {
    const parsedData = exerciseTemplateCreateSchema.parse(data);

    const exerciseTemplate = await exerciseManagerService.patchExerciseTemplate(
        id,
        parsedData
    );

    return {
        statusCode: 201,
        body: exerciseTemplateSchema.encode(exerciseTemplate),
    };
}
