import type {
    ExerciseAction,
    ExerciseId,
    ExerciseState,
} from 'fuesim-digital-shared';
import { applyMigrations } from 'fuesim-digital-shared';
import type { WritableDraft } from 'immer';
import { RestoreError } from '../utils/restore-error.js';
import type { ExerciseRepository } from './repositories/exercise-repository.js';
import type { ActionRepository } from './repositories/action-repository.js';

export async function migrateInDatabase(
    exerciseId: ExerciseId,
    exerciseRepository: ExerciseRepository,
    actionRepository: ActionRepository
): Promise<void> {
    const exercise = (await exerciseRepository.getExerciseById(exerciseId))
        ?.exercise_entity;
    if (!exercise) {
        throw new RestoreError(
            'Cannot find exercise to convert in database',
            exerciseId
        );
    }

    const loadedInitialState = exercise.initialStateString;
    const loadedCurrentState = exercise.currentStateString;
    const loadedActions = (
        await actionRepository.getActionsForExerciseId(exerciseId)
    ).map((action) => action.actionString);
    const {
        newVersion,
        migratedProperties: { currentState, history },
    } = applyMigrations(exercise.stateVersion, {
        currentState: loadedCurrentState,
        history: {
            initialState: loadedInitialState,
            actions: loadedActions,
        },
    });
    const initialState: WritableDraft<ExerciseState> =
        history?.initialState ?? currentState;
    const actions = history?.actions ?? [];

    exercise.stateVersion = newVersion;
    exercise.initialStateString = initialState;
    exercise.currentStateString = currentState;

    await exerciseRepository.saveExerciseState(exerciseId, exercise);

    // Save actions
    let patchedActionsIndex = 0;
    const indicesToRemove: number[] = [];
    const actionsToUpdate: {
        previousIndex: number;
        newIndex: number;
        actionString: ExerciseAction;
    }[] = [];
    if (actions.length > 0) {
        actions.forEach((action, i) => {
            if (action === null) {
                indicesToRemove.push(i);
                return;
            }
            actionsToUpdate.push({
                previousIndex: i,
                newIndex: patchedActionsIndex++,
                actionString: action,
            });
        });
        if (indicesToRemove.length > 0) {
            await actionRepository.deleteActionIndices(
                exerciseId,
                indicesToRemove
            );
        }
        if (actionsToUpdate.length > 0) {
            await Promise.all(
                actionsToUpdate.map(
                    async ({ previousIndex, newIndex, actionString }) =>
                        actionRepository.updateActionIndex(
                            exerciseId,
                            previousIndex,
                            newIndex,
                            actionString
                        )
                )
            );
        }
    } else {
        await actionRepository.deleteAllForExercise(exerciseId);
    }
}
