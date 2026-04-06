import { eq, and, inArray } from 'drizzle-orm';
import type { ExerciseAction, ExerciseId } from 'fuesim-digital-shared';
import { actionTable } from '../schema.js';
import type { ActionWrapper } from '../../exercise/action-wrapper.js';
import { BaseRepository } from './base-repository.js';
import { DatabaseService } from './../services/database-service.js';

export class ActionRepository extends BaseRepository {
    public async getActionsForExerciseId(exerciseId: ExerciseId) {
        return this.databaseConnection.query.actionTable.findMany({
            where: {
                exerciseId: { eq: exerciseId },
            },
            orderBy: { index: 'asc' },
        });
    }

    public async deleteAllForExercise(exerciseId: ExerciseId) {
        await this.databaseConnection
            .delete(actionTable)
            .where(eq(actionTable.exerciseId, exerciseId));
    }

    public async saveActions(actions: ActionWrapper[]) {
        if (actions.length === 0) return;

        const dbInsertResult = await this.databaseConnection
            .insert(actionTable)
            .values(
                actions
                    .map((actionWrapper) => ({
                        actionWrapper,
                        action: actionWrapper.getAction(),
                    }))
                    .map(({ actionWrapper, action }) => ({
                        actionString: action.actionString,
                        emitterId: action.emitterId,
                        exerciseId: actionWrapper.exercise.exercise.id,
                        index: action.index,
                        id: action.id,
                    }))
                    .map((actionPatch) => {
                        // Remove undefined, so that we dont accidentally remove IDs on upsert
                        if (actionPatch.id === undefined) {
                            delete actionPatch.id;
                        }
                        return actionPatch;
                    })
            )
            .onConflictDoUpdate({
                target: actionTable.id,
                set: DatabaseService.upsertHelper(actionTable),
            })
            .returning();

        for (const [i, element] of dbInsertResult.entries()) {
            const matchingAction = actions[i];

            if (!matchingAction) {
                throw new Error('Could not find matching action after upsert');
            }

            // Update the action ID in the ActionWrapper
            // to prevent this action being re-inserted
            // incase it is still in termporaryActionHistory next time
            matchingAction.getAction().id = element.id;
        }
    }

    public async updateActionIndex(
        exerciseId: ExerciseId,
        previousIndex: number,
        newIndex: number,
        actionString: ExerciseAction
    ) {
        return this.databaseConnection
            .update(actionTable)
            .set({
                index: newIndex,
                actionString,
            })
            .where(
                and(
                    eq(actionTable.exerciseId, exerciseId),
                    eq(actionTable.index, previousIndex)
                )
            );
    }

    public async deleteActionIndices(
        exerciseId: ExerciseId,
        indicesToRemove: number[]
    ) {
        return this.databaseConnection
            .delete(actionTable)
            .where(
                and(
                    eq(actionTable.exerciseId, exerciseId),
                    inArray(actionTable.index, indicesToRemove)
                )
            );
    }
}
