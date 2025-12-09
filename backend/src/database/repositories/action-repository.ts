import { upsertHelper } from 'database/services/database-service.js';
import { actionWrapperTable } from 'database/schema.js';
import type { InferInsertModel } from 'drizzle-orm';
import { eq, asc, and, inArray } from 'drizzle-orm';
import type { ExerciseAction } from 'digital-fuesim-manv-shared';
import type { ActionWrapper } from 'exercise/action-wrapper.js';
import { BaseRepository } from './base-repository.js';

export class ActionRepository extends BaseRepository {
    public async getActionsForExerciseId(exerciseId: string) {
        return this.databaseConnection
            .select()
            .from(actionWrapperTable)
            .where(eq(actionWrapperTable.exerciseId, exerciseId))
            .orderBy(asc(actionWrapperTable.index));
    }

    public async deleteAllForExercise(exerciseId: string) {
        await this.databaseConnection
            .delete(actionWrapperTable)
            .where(eq(actionWrapperTable.exerciseId, exerciseId));
    }

    // TODO: @Quixelation --> sollte hier der Wrapper übergeben werden, oder wie bei Exercises nur das Object?
    public async saveActions(actions: ActionWrapper[]) {
        const actionsPatch: InferInsertModel<typeof actionWrapperTable>[] =
            actions.map((actionWrapper) => {
                const { actionString, emitterId, exerciseId, index, id } =
                    actionWrapper.getAction();
                const actionPatch: typeof actionWrapperTable.$inferInsert = {
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
        const results = await this.databaseConnection
            .insert(actionWrapperTable)
            .values(actionsPatch)
            .onConflictDoUpdate({
                target: actionWrapperTable.id,
                set: upsertHelper(actionWrapperTable),
            })
            .returning();

        if (results.length !== actionsPatch.length) {
            console.error('Not all actions were saved');
        }
        for (const [i, result] of results.entries()) {
            if (actionsPatch[i]?.id !== undefined) {
                actionsPatch[i].id = result.id;
            }
        }
        return results;
    }

    public async updateActionIndex(
        exerciseId: string,
        previousIndex: number,
        newIndex: number,
        actionString: ExerciseAction
    ) {
        return this.databaseConnection
            .update(actionWrapperTable)
            .set({
                index: newIndex,
                actionString,
            })
            .where(
                and(
                    eq(actionWrapperTable.exerciseId, exerciseId),
                    eq(actionWrapperTable.index, previousIndex)
                )
            );
    }

    public async deleteActionIndices(
        exerciseId: string,
        indicesToRemove: number[]
    ) {
        return this.databaseConnection
            .delete(actionWrapperTable)
            .where(
                and(
                    eq(actionWrapperTable.exerciseId, exerciseId),
                    inArray(actionWrapperTable.index, indicesToRemove)
                )
            );
    }
}
