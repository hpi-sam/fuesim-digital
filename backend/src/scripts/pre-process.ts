import fs from 'node:fs';
import type { ParallelExerciseId } from 'fuesim-digital-shared';
import { applyAction, cloneDeepMutable } from 'fuesim-digital-shared';
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
import {
    actionProcessorDictionary,
    type ProcessEvent,
} from './action-processors.js';

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
    exerciseService
);

const parallelExerciseInstances =
    await repositories.parallelExerciseRepository.getParallelExerciseInstancesById(
        parallelExerciseId
    );

const processEvents = [];

for (const parallelExerciseInstance of parallelExerciseInstances) {
    const actions = await repositories.actionRepository.getActionsForExerciseId(
        parallelExerciseInstance.id
    );
    const currentState = cloneDeepMutable(
        parallelExerciseInstance.initialStateString
    );
    console.log(`INSTANCE ${parallelExerciseInstance.id}`);

    let exerciseRunning = false;
    let previousEvent: ProcessEvent | null = null;
    for (const [i, actionEntry] of actions.entries()) {
        const action = actionEntry.actionString;
        applyAction(currentState, action);

        if (action.type === '[Exercise] Start') {
            exerciseRunning = true;
        }

        // Only use actions during exercise run
        if (!exerciseRunning) continue;

        const actionProcessor = actionProcessorDictionary[action.type];

        if (actionProcessor !== undefined) {
            const processEvent = actionProcessor.processFull(
                currentState,
                action,
                i
            );
            if (
                actionProcessor.mergeSubsequent &&
                previousEvent?.['concept:name'] === processEvent['concept:name']
            ) {
                previousEvent.endTime = currentState.currentTime;
                continue;
            }

            console.log(
                `[EVENT] ${processEvent['time:timestamp']} ${processEvent['concept:name']} ${processEvent.verboseName}`
            );
            previousEvent = processEvent;
            processEvents.push(processEvent);
        }
        if (action.type === '[Exercise] Pause') {
            exerciseRunning = false;
        }
    }
}

const jsonContent = JSON.stringify(processEvents);
fs.writeFile('events.json', jsonContent, (err) => {
    if (err) throw err;
});

const result = await fetch('http://localhost:4202/process', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: jsonContent,
});
console.log(await result.json());
