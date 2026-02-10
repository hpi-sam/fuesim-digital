import type { AuthService } from '../../auth/auth-service.js';
import type { S3Service } from '../../s3/s3-service.js';
import type { CollectionService } from './collection-service.js';
import type { DatabaseService } from './database-service.js';
import type { ExerciseManagerService } from './exercise-manager-service.js';
import type { ExerciseService } from './exercise-service.js';
import type { OrganisationService } from './organisation-service.js';
import type { ParallelExerciseService } from './parallel-exercise-service.js';
import type { UserDataService } from './userdata-service.js';

export interface Services {
    databaseService: DatabaseService;
    s3Service: S3Service;
    exerciseService: ExerciseService;
    exerciseManagerService: ExerciseManagerService;
    parallelExerciseService: ParallelExerciseService;
    organisationService: OrganisationService;
    authService: AuthService;
    collectionService: CollectionService;
    userDataService: UserDataService;
}
