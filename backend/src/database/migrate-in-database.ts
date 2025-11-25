import type {
    ExerciseAction,
    ExerciseState,
    Mutable,
    UUID,
} from 'digital-fuesim-manv-shared';
import { applyMigrations } from 'digital-fuesim-manv-shared';
import { eq, asc, and, inArray } from 'drizzle-orm';
import { RestoreError } from '../utils/restore-error.js';
import { exerciseWrapperTable, actionWrapperTable } from './schema.js';
import type { DatabaseTransaction } from './services/database-service.js';

export async function migrateInDatabase(
    exerciseId: UUID,
    transaction: DatabaseTransaction
): Promise<void> {
    const exercises = await transaction
        .select()
        .from(exerciseWrapperTable)
        .where(eq(exerciseWrapperTable.id, exerciseId));
    if (exercises.length === 0 && exercises[0] === undefined) {
        throw new RestoreError(
            'Cannot find exercise to convert in database',
            exerciseId
        );
    }
    const exercise = exercises[0]!;
    const loadedInitialState = exercise.initialStateString as object;
    const loadedCurrentState = exercise.currentStateString as object;
    const loadedActions = (
        await transaction
            .select({ actionString: actionWrapperTable.actionString })
            .from(actionWrapperTable)
            .where(eq(actionWrapperTable.exerciseId, exerciseId))
            .orderBy(asc(actionWrapperTable.index))
    ).map((action) => action.actionString as object);
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
    const initialState: Mutable<ExerciseState> =
        history?.initialState ?? currentState;
    const actions = history?.actions ?? [];

    exercise.stateVersion = newVersion;

    await transaction
        .update(exerciseWrapperTable)
        .set({
            stateVersion: exercise.stateVersion,
            initialStateString: initialState,
            currentStateString: currentState,
        })
        .where(eq(exerciseWrapperTable.id, exerciseId));
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
            await transaction
                .delete(actionWrapperTable)
                .where(
                    and(
                        eq(actionWrapperTable.exerciseId, exerciseId),
                        inArray(actionWrapperTable.index, indicesToRemove)
                    )
                );
        }
        if (actionsToUpdate.length > 0) {
            await Promise.all(
                actionsToUpdate.map(
                    async ({ previousIndex, newIndex, actionString }) =>
                        transaction
                            .update(actionWrapperTable)
                            .set({
                                index: newIndex,
                                actionString,
                            })
                            .where(
                                and(
                                    eq(
                                        actionWrapperTable.exerciseId,
                                        exerciseId
                                    ),
                                    eq(actionWrapperTable.index, previousIndex)
                                )
                            )
                )
            );
        }
    } else {
        await transaction
            .delete(actionWrapperTable)
            .where(eq(actionWrapperTable.exerciseId, exerciseId));
    }
}
