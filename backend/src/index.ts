import { ReducerError } from 'fuesim-digital-shared';
import { ZodError } from 'zod';
import { DatabaseService } from './database/services/database-service.js';
import { RestoreError } from './utils/restore-error.js';
import { Config } from './config.js';
import { FuesimServer } from './fuesim-server.js';
import { ActionRepository } from './database/repositories/action-repository.js';
import { ExerciseRepository } from './database/repositories/exercise-repository.js';
import { ExerciseService } from './database/services/exercise-service.js';
import { UserRepository } from './database/repositories/user-repository.js';
import { SessionRepository } from './database/repositories/session-repository.js';
import { AuthService } from './auth/auth-service.js';
import { ExerciseManagerService } from './database/services/exercise-manager-service.js';
import { AccessKeyRepository } from './database/repositories/access-key-repository.js';
import type { Repositories } from './database/repositories/index.js';
import { ParallelExerciseRepository } from './database/repositories/parallel-exercise-repository.js';
import type { Services } from './database/services/index.js';
import { ParallelExerciseService } from './database/services/parallel-exercise-service.js';
import { OrganisationService } from './database/services/organisation-service.js';
import { OrganisationRepository } from './database/repositories/organisation-repository.js';
import { CollectionRepository } from './database/repositories/collection-repository.js';
import { CollectionService } from './database/services/collection-service.js';

async function main() {
    Config.initialize();

    if (!Config.useDb) {
        console.warn(
            'Note that no database gets used. This means any data created will be stored in-memory until the exercise gets deleted or the server stops, and in case the server stops all data is gone.'
        );
    }

    let databaseService: DatabaseService;
    try {
        databaseService = await DatabaseService.createNewDatabaseConnection();
    } catch (e: unknown) {
        console.error('Error connecting to the database:');
        throw e;
    }
    console.log('Successfully connected to the database.');

    const repositories: Repositories = {
        exerciseRepository: new ExerciseRepository(
            databaseService.databaseConnection
        ),
        actionRepository: new ActionRepository(
            databaseService.databaseConnection
        ),
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
        organisationRepository: new OrganisationRepository(
            databaseService.databaseConnection
        ),
        collectionRepository: new CollectionRepository(
            databaseService.databaseConnection
        ),
    };

    const exerciseService = new ExerciseService(
        repositories.exerciseRepository,
        repositories.actionRepository,
        repositories.organisationRepository
    );
    const exerciseManagerService = new ExerciseManagerService(
        repositories.exerciseRepository,
        exerciseService,
        repositories.organisationRepository
    );
    const parallelExerciseService = new ParallelExerciseService(
        repositories.parallelExerciseRepository,
        exerciseManagerService,
        exerciseService
    );
    const organisationService = new OrganisationService(
        repositories.organisationRepository,
        repositories.userRepository
    );
    const collectionService = new CollectionService(
        organisationService,
        repositories.collectionRepository
    );

    await collectionService.initialize();

    let authService: AuthService;
    try {
        authService = await new AuthService(
            repositories.userRepository,
            repositories.sessionRepository,
            organisationService
        ).initialize();
    } catch (e: unknown) {
        console.error('Error initializing AuthService:');
        throw e;
    }

    const services: Services = {
        authService,
        exerciseManagerService,
        exerciseService,
        parallelExerciseService,
        databaseService,
        organisationService,
        collectionService,
    };

    if (Config.useDb) {
        try {
            console.log('Loading exercises from database…');
            const startTime = performance.now();
            const exercises = await exerciseService.restoreAllExercises();
            const endTime = performance.now();
            console.log(
                `✅ Successfully loaded ${exercises.length} exercise(s) in ${(
                    endTime - startTime
                ).toFixed(3)} ms.`
            );
        } catch (e: unknown) {
            console.error('❌ An error occurred while loading exercises.');
            if (e instanceof ZodError) {
                console.error(
                    'The validation of the exercises and actions in the database failed:',
                    e.message
                );
                return;
            } else if (e instanceof ReducerError) {
                console.error('Could not apply an action:', e.message, e.stack);
                return;
            } else if (e instanceof RestoreError) {
                console.error(
                    `Error while restoring exercise \`${e.exerciseId}\`:`,
                    e.message,
                    e.stack,
                    e.cause
                );
                return;
            }
            throw e;
        }

        await organisationService.ensurePersonalOrganisationsForAllUsers();
    }

    // eslint-disable-next-line no-new
    new FuesimServer(services);
}

main();
