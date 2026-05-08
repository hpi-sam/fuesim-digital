import type { ExerciseId, ExerciseState } from 'fuesim-digital-shared';
import { applyMigrations } from 'fuesim-digital-shared';
import type { WritableDraft } from 'immer';
import { RestoreError } from '../utils/restore-error.js';
import type { ExerciseRepository } from './repositories/exercise-repository.js';
import type { ActionRepository } from './repositories/action-repository.js';
import type { ActionEntry } from './schema.js';

export async function migrateInDatabase(
    exerciseId: ExerciseId,
    exerciseRepository: ExerciseRepository,
    actionRepository: ActionRepository
): Promise<void> {
    const exercise = await exerciseRepository.getExerciseById(exerciseId);
    if (!exercise) {
        throw new RestoreError(
            'Cannot find exercise to convert in database',
            exerciseId
        );
    }

    const loadedInitialState = exercise.initialStateString;
    const loadedCurrentState = exercise.currentStateString;
    const loadedActions =
        await actionRepository.getActionsForExerciseId(exerciseId);
    const {
        newVersion,
        migratedProperties: { currentState, history },
    } = applyMigrations(exercise.stateVersion, {
        currentState: loadedCurrentState,
        history: {
            initialState: loadedInitialState,
            actions: loadedActions.map((action) => action.actionString),
        },
    });

    const initialState: WritableDraft<ExerciseState> =
        history?.initialState ?? currentState;
    const actions = history?.actions ?? [];

    exercise.stateVersion = newVersion;
    exercise.initialStateString = initialState;
    exercise.currentStateString = currentState;

    await exerciseRepository.saveExerciseState(exercise);

    // Delete all old actions
    await actionRepository.deleteAllForExercise(exerciseId);

    // Save actions
    let patchedActionsIndex = 0;
    const actionsToUpdate: ActionEntry[] = [];
    actions.forEach((action, i) => {
        if (action === null) {
            return;
        }
        const previousAction = loadedActions[i]!;
        actionsToUpdate.push({
            ...previousAction,
            index: patchedActionsIndex++,
            actionString: action,
        });
    });

    // Batch this because Postgres only supports a limited count of parameters
    for (let i = 0; i < actionsToUpdate.length; i += 1000) {
        const currentBatch = actionsToUpdate.slice(i, i + 1000);
        // eslint-disable-next-line no-await-in-loop
        await actionRepository.insertActions(currentBatch);
    }
}
