import { eq, asc } from 'drizzle-orm';
import type { ExerciseId } from 'fuesim-digital-shared';
import { type ActionEntry, actionTable } from '../schema.js';
import type { ActionWrapper } from '../../exercise/action-wrapper.js';
import { BaseRepository } from './base-repository.js';
import { DatabaseService } from './../services/database-service.js';

export class ActionRepository extends BaseRepository {
    public async getActionsForExerciseId(exerciseId: ExerciseId) {
        return this.databaseConnection
            .select()
            .from(actionTable)
            .where(eq(actionTable.exerciseId, exerciseId))
            .orderBy(asc(actionTable.index));
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

    public async insertActions(actions: ActionEntry[]) {
        return this.databaseConnection
            .insert(actionTable)
            .values(actions)
            .returning();
    }
}
