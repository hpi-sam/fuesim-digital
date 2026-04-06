import type { AccessKeyRepository } from './access-key-repository.js';
import type { ActionRepository } from './action-repository.js';
import type { ExerciseRepository } from './exercise-repository.js';
import type { SessionRepository } from './session-repository.js';
import type { UserRepository } from './user-repository.js';
import type { ParallelExerciseRepository } from './parallel-exercise-repository.js';
import { OrganisationRepository } from './organisation-repository.js';

export interface Repositories {
    accessKeyRepository: AccessKeyRepository;
    actionRepository: ActionRepository;
    exerciseRepository: ExerciseRepository;
    sessionRepository: SessionRepository;
    userRepository: UserRepository;
    parallelExerciseRepository: ParallelExerciseRepository;
    organisationRepository: OrganisationRepository;
}
