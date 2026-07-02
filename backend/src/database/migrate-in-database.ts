import type { ExerciseId, ExerciseState } from 'fuesim-digital-shared';
import { applyMigrations, currentStateVersion, exerciseStateSchema } from 'fuesim-digital-shared';
import { castDraft } from 'immer';
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

    const loadedInitialState: ExerciseState = exerciseStateSchema.parse(exercise.initialStateString);
    const loadedCurrentState: ExerciseState = exerciseStateSchema.parse(exercise.currentStateString);
    const loadedActions =
        await actionRepository.getActionsForExerciseId(exerciseId);
    const { currentState, history } = applyMigrations(exercise.stateVersion, {
        currentState: loadedCurrentState,
        history: {
            initialState: loadedInitialState,
            actionHistory: loadedActions.map((action) => action.actionString),
        },
    });

    const initialState: ExerciseState = history?.initialState ?? currentState;
    const actions = history?.actionHistory ?? [];

    exercise.stateVersion = currentStateVersion;
    exercise.initialStateString = exerciseStateSchema.encode(castDraft(initialState));
    exercise.currentStateString = exerciseStateSchema.encode(castDraft(currentState));

    await exerciseRepository.saveExerciseState(exercise, initialState, currentState);

    // Delete all old actions
    await actionRepository.deleteAllForExercise(exerciseId);

    // Save actions
    let patchedActionsIndex = 0;
    const actionsToUpdate: ActionEntry[] = [];
    actions.forEach((action, i) => {
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
