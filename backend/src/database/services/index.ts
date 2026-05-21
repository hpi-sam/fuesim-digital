import type { AuthService } from '../../auth/auth-service.js';
import type { DatabaseService } from './database-service.js';
import type { ExerciseManagerService } from './exercise-manager-service.js';
import type { ExerciseService } from './exercise-service.js';
import type { ParallelExerciseService } from './parallel-exercise-service.js';

export interface Services {
    databaseService: DatabaseService;
    exerciseService: ExerciseService;
    exerciseManagerService: ExerciseManagerService;
    parallelExerciseService: ParallelExerciseService;
    authService: AuthService;
}
