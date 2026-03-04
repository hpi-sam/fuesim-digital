import type { ExerciseTemplateId } from 'fuesim-digital-shared';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';
import type { ActionRepository } from '../repositories/action-repository.js';
import type { SessionInformation } from '../../auth/auth-service.js';
import type { ExerciseTemplateInsert } from '../schema.js';
import {
    ApiError,
    NotFoundError,
    PermissionDeniedError,
} from '../../utils/http.js';
import type { ExerciseService } from './exercise-service.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository,
        private readonly actionRepository: ActionRepository
    ) {}

    public async getAllExercisesOfOwner(session: SessionInformation) {
        return this.exerciseRepository.getAllExercisesOfOwner(session.user.id);
    }

    public async getAllExerciseTemplatesOfOwner(session: SessionInformation) {
        return this.exerciseRepository.getAllExerciseTemplatesOfOwner(
            session.user.id
        );
    }

    public async createExerciseTemplate(
        data: Omit<ExerciseTemplateInsert, 'user'>,
        session: SessionInformation,
        exerciseService: ExerciseService
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate({
                ...data,
                user: session.user.id,
            });
        if (!exerciseTemplate) {
            throw new ApiError();
        }
        const newExercise = ExerciseFactory.fromBlank();
        await exerciseService.createTemplate(newExercise, exerciseTemplate);
        return {
            ...exerciseTemplate,
            trainerKey: newExercise.trainerKey,
        };
    }

    public async updateExerciseTemplate(
        id: ExerciseTemplateId,
        session: SessionInformation,
        data: Partial<ExerciseTemplateInsert>
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.exercise_template.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        const updatedTemplate =
            await this.exerciseRepository.updateExerciseTemplate(
                exerciseTemplate.exercise_template.id,
                data
            );
        if (!updatedTemplate) {
            throw new ApiError();
        }
        return {
            ...updatedTemplate,
            trainerKey: exerciseTemplate.exercise_entity.trainerKey,
        };
    }

    public async createExerciseFromTemplate(
        templateId: ExerciseTemplateId,
        session: SessionInformation,
        exerciseService: ExerciseService
    ) {
        await exerciseService.saveUnsavedExercises();

        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(templateId);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.exercise_template.user !== session.user.id) {
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
            user: session.user.id,
        });
        await this.exerciseRepository.updateExerciseTemplate(
            exerciseTemplate.exercise_template.id,
            { lastExerciseCreatedAt: new Date() }
        );
        return newExercise;
    }

    public async deleteExerciseTemplate(
        id: ExerciseTemplateId,
        session: SessionInformation,
        exerciseService: ExerciseService
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw new NotFoundError();
        }
        if (exerciseTemplate.exercise_template.user !== session.user.id) {
            throw new PermissionDeniedError();
        }
        const activeExercise = exerciseService.getExerciseByKey(
            exerciseTemplate.exercise_entity.trainerKey,
            session
        );
        exerciseService.unloadExercise(activeExercise);

        await this.exerciseRepository.deleteExerciseTemplateById(
            exerciseTemplate.exercise_template.id
        );
    }
}
