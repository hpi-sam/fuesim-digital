import type { InferInsertModel } from 'drizzle-orm';
import { eq, asc, and, inArray } from 'drizzle-orm';
import type { ExerciseAction } from 'digital-fuesim-manv-shared';
import { actionTable } from '../schema.js';
import type { ActionWrapper } from '../../exercise/action-wrapper.js';
import { BaseRepository } from './base-repository.js';

export class ActionRepository extends BaseRepository {
    public async getActionsForExerciseId(exerciseId: string) {
        return this.databaseConnection
            .select()
            .from(actionTable)
            .where(eq(actionTable.exerciseId, exerciseId))
            .orderBy(asc(actionTable.index));
    }

    public async deleteAllForExercise(exerciseId: string) {
        await this.databaseConnection
            .delete(actionTable)
            .where(eq(actionTable.exerciseId, exerciseId));
    }

    public async saveActions(actions: ActionWrapper[]) {
        if (actions.length === 0) return;

        const actionsPatch: InferInsertModel<typeof actionTable>[] =
            actions.map((actionWrapper) => {
                const action = actionWrapper.getAction();
                const actionPatch: typeof actionTable.$inferInsert = {
                    actionString: action.actionString,
                    emitterId: action.emitterId,
                    exerciseId: actionWrapper.exercise.exerciseId,
                    index: action.index,
                };
                if (action.id !== undefined) {
                    actionPatch.id = action.id;
                }
                return actionPatch;
            });

        return this.databaseConnection.transaction(async (tx) => {
            const actionPromises = actionsPatch.map(async (action) => {
                const dbInsertResult = await tx
                    .insert(actionTable)
                    .values(action)
                    .onConflictDoUpdate({
                        target: actionTable.id,
                        set: {
                            id: action.id,
                            actionString: action.actionString,
                            emitterId: action.emitterId,
                            exerciseId: action.exerciseId,
                            index: action.index,
                        },
                    })
                    .returning();

                if (
                    dbInsertResult.length !== 1 ||
                    dbInsertResult[0] === undefined
                ) {
                    throw new Error('Could not upsert action');
                }

                action.id ??= dbInsertResult[0].id;

                return dbInsertResult;
            });

            const awaitedResults = await Promise.all(actionPromises);

            return awaitedResults;
        });
    }

    public async updateActionIndex(
        exerciseId: string,
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
        exerciseId: string,
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
