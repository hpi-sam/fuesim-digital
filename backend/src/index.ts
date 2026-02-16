import * as util from 'node:util';
import { ReducerError } from 'fuesim-digital-shared';
import { DatabaseService } from './database/services/database-service.js';
import { ValidationErrorWrapper } from './utils/validation-error-wrapper.js';
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
import { AccessKeyService } from './database/services/access-key-service.js';
import { AccessKeyRepository } from './database/repositories/access-key-repository.js';

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

    const exerciseRepository = new ExerciseRepository(
        databaseService.databaseConnection
    );
    const actionRepository = new ActionRepository(
        databaseService.databaseConnection
    );
    const userRepository = new UserRepository(
        databaseService.databaseConnection
    );
    const sessionRepository = new SessionRepository(
        databaseService.databaseConnection
    );
    const accessKeyRepository = new AccessKeyRepository(
        databaseService.databaseConnection
    );

    const accessKeyService = new AccessKeyService(accessKeyRepository);
    const exerciseService = new ExerciseService(
        exerciseRepository,
        actionRepository,
        accessKeyService
    );
    const exerciseManagerService = new ExerciseManagerService(
        exerciseRepository,
        actionRepository,
        exerciseService
    );

    let authService: AuthService;
    try {
        authService = await new AuthService(
            userRepository,
            sessionRepository
        ).initialize();
    } catch (e: unknown) {
        console.error('Error initializing AuthService:');
        throw e;
    }

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
            if (e instanceof ValidationErrorWrapper) {
                console.error(
                    'The validation of the exercises and actions in the database failed:',
                    util.inspect(e.errors, false, null, true)
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
    }

    // eslint-disable-next-line no-new
    new FuesimServer(
        databaseService,
        exerciseService,
        authService,
        exerciseManagerService,
        accessKeyService
    );
}

main();
