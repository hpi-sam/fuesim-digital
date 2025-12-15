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

    // TODO: @Quixelation --> sollte hier der Wrapper übergeben werden, oder wie bei Exercises nur das Object?
    public async saveActions(actions: ActionWrapper[]) {
        if (actions.length === 0) return;

        const actionsPatch: InferInsertModel<typeof actionTable>[] =
            actions.map((actionWrapper) => {
                const { actionString, emitterId, exerciseId, index, id } =
                    actionWrapper.getAction();
                const actionPatch: typeof actionTable.$inferInsert = {
                    actionString,
                    emitterId,
                    exerciseId,
                    index,
                };
                if (id !== undefined) {
                    actionPatch.id = id;
                }
                return actionPatch;
            });

        return this.databaseConnection.transaction(async (tx) => {
            const results = [];
            for (const action of actionsPatch) {
                const result = await tx
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

                if (result.length !== 1 || result[0] === undefined) {
                    throw new Error('Could not upsert action');
                }
                if (action.id !== undefined) {
                    action.id = result[0].id;
                }
                results.push(result);
            }
            return results;
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
