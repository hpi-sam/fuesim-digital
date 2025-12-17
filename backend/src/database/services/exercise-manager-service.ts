import type { ExerciseRepository } from '../repositories/exercise-repository.js';

export class ExerciseManagerService {
    public constructor(
        private readonly exerciseRepository: ExerciseRepository
    ) {}

    public async getAllExercisesOfOwner() {
        return this.exerciseRepository.getAllExercisesOfOwner();
    }
}
