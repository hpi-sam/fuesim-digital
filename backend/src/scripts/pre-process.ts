import fs from 'node:fs';
import type { ParallelExerciseId } from 'fuesim-digital-shared';
import { DatabaseService } from '../database/services/database-service.js';
import { ParallelExerciseRepository } from '../database/repositories/parallel-exercise-repository.js';
import { ParallelExerciseService } from '../database/services/parallel-exercise-service.js';
import { ExerciseRepository } from '../database/repositories/exercise-repository.js';
import { ActionRepository } from '../database/repositories/action-repository.js';
import { UserRepository } from '../database/repositories/user-repository.js';
import { SessionRepository } from '../database/repositories/session-repository.js';
import { AccessKeyRepository } from '../database/repositories/access-key-repository.js';
import { AccessKeyService } from '../database/services/access-key-service.js';
import { ExerciseService } from '../database/services/exercise-service.js';
import { ExerciseManagerService } from '../database/services/exercise-manager-service.js';
import type { Repositories } from '../database/repositories/index.js';

const parallelExerciseId =
    'd4af4336-3c07-46f9-a2de-cdbd6c38785f' as ParallelExerciseId;

const databaseService = await DatabaseService.createNewDatabaseConnection();

const repositories: Repositories = {
    exerciseRepository: new ExerciseRepository(
        databaseService.databaseConnection
    ),
    actionRepository: new ActionRepository(databaseService.databaseConnection),
    userRepository: new UserRepository(databaseService.databaseConnection),
    sessionRepository: new SessionRepository(
        databaseService.databaseConnection
    ),
    accessKeyRepository: new AccessKeyRepository(
        databaseService.databaseConnection
    ),
    parallelExerciseRepository: new ParallelExerciseRepository(
        databaseService.databaseConnection
    ),
};

const accessKeyService = new AccessKeyService(repositories.accessKeyRepository);
const exerciseService = new ExerciseService(
    repositories.exerciseRepository,
    repositories.actionRepository,
    accessKeyService
);
const exerciseManagerService = new ExerciseManagerService(
    repositories.exerciseRepository,
    exerciseService
);
const parallelExerciseService = new ParallelExerciseService(
    repositories.parallelExerciseRepository,
    accessKeyService,
    exerciseManagerService,
    exerciseService,
    repositories.actionRepository
);

const processEvents =
    await parallelExerciseService.preProcessTraces(parallelExerciseId);

const jsonContent = JSON.stringify(Object.values(processEvents).flat());
fs.writeFile('events.json', jsonContent, (err) => {
    if (err) throw err;
});
