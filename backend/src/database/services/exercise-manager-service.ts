import type { ExerciseTemplateCreateData } from 'digital-fuesim-manv-shared';
import type { ExerciseRepository } from '../repositories/exercise-repository.js';
import { ExerciseFactory } from '../../exercise/exercise-factory.js';
import type { ExerciseService } from './exercise-service.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository
    ) {}

    public async getAllExercisesOfOwner() {
        return this.exerciseRepository.getAllExercisesOfOwner();
    }

    public async getAllExerciseTemplatesOfOwner() {
        return this.exerciseRepository.getAllExerciseTemplatesOfOwner();
    }

    public async createExerciseTemplate(
        data: ExerciseTemplateCreateData,
        exerciseService: ExerciseService
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.createExerciseTemplate(data);
        if (!exerciseTemplate) {
            throw Error('Exercise template not created');
        }
        const newExercise = ExerciseFactory.fromBlank();
        await this.exerciseRepository.createExerciseIfNotExists(
            newExercise,
            exerciseTemplate.id
        );
        await exerciseService.loadExercise(newExercise);
        return {
            ...exerciseTemplate,
            trainerId: newExercise.getExercise().trainerId,
        };
    }

    public async patchExerciseTemplate(
        id: string,
        data: ExerciseTemplateCreateData
    ) {
        const exerciseTemplate =
            await this.exerciseRepository.getExerciseTemplateById(id);
        if (!exerciseTemplate) {
            throw Error('Exercise template does not exist');
        }
        return {
            ...(await this.exerciseRepository.patchExerciseTemplate(
                exerciseTemplate.exercise_template.id,
                data
            )),
            trainerId: exerciseTemplate.exercise_entity.trainerId,
        };
    }
}
