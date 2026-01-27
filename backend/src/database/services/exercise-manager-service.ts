import type { ExerciseTemplateCreateData } from 'digital-fuesim-manv-shared';
import {
    NotFoundError,
    PermissionDeniedError,
} from 'digital-fuesim-manv-shared';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';
import type { ActionRepository } from '../repositories/action-repository.js';
import type { ExerciseService } from './exercise-service.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository
    ) {}

    public async getAllExercisesOfOwner(userId: string) {
        return this.exerciseRepository.getAllExercisesOfOwner(userId);
    }

    public async getAllExerciseTemplatesOfOwner(userId: string) {
        return this.exerciseRepository.getAllExerciseTemplatesOfOwner(userId);
    }

    public async createExerciseTemplate(
        data: ExerciseTemplateCreateData,
        userId: string,
        exerciseService: ExerciseService
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate({
                ...data,
                user: userId,
            });
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        const newExercise = ExerciseFactory.fromBlank();
        await exerciseService.createTemplate(newExercise, exerciseTemplate);
        return {
            ...exerciseTemplate,
            trainerId: newExercise.getExercise().trainerId,
        };
    }

    public async patchExerciseTemplate(
        id: string,
        userId: string,
        data: ExerciseTemplateCreateData
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.exercise_template.user !== userId) {
            throw new PermissionDeniedError();
        }
        return {
            ...(await this.exerciseRepository.patchExerciseTemplate(
                exerciseTemplate.exercise_template.id,
                data
            )),
            trainerId: exerciseTemplate.exercise_entity.trainerId,
        };
    }

    public async createExerciseFromTemplate(
        id: string,
        userId: string,
        exerciseService: ExerciseService
    ) {
        await exerciseService.saveUnsavedExercises();

        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.exercise_template.user !== userId) {
            throw new PermissionDeniedError();
        }
        const actions = await this.actionRepository.getActionsForExerciseId(
            exerciseTemplate.exercise_entity.id
        );

        const newExercise = ExerciseFactory.fromExerciseTemplate(
            exerciseTemplate.exercise_template,
            exerciseTemplate.exercise_entity,
            actions
        );
        await exerciseService.createExercise(newExercise, {
            baseTemplateId: exerciseTemplate.exercise_template.id,
            user: userId,
        });
        await this.exerciseRepository.patchExerciseTemplate(
            exerciseTemplate.exercise_template.id,
            { lastExerciseCreatedAt: new Date() }
        );
        return newExercise;
    }

    public async deleteExerciseTemplate(
        id: string,
        userId: string,
        exerciseService: ExerciseService
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.exercise_template.user !== userId) {
            throw new PermissionDeniedError();
        }
        const activeExercise = exerciseService.getExerciseByKey(
            exerciseTemplate.exercise_entity.trainerId
        );
        if (activeExercise) {
            exerciseService.destroyExercise(activeExercise);
        }

        await this.exerciseRepository.deleteExerciseTemplateById(
            exerciseTemplate.exercise_template.id
        );
    }
}
