import { exerciseWrapperTable } from 'database/schema.js';
import { ExerciseState } from 'digital-fuesim-manv-shared';
import type { InferInsertModel } from 'drizzle-orm';
import { eq, lt } from 'drizzle-orm';
import { BaseRepository } from './base-repository.js';

export class ExerciseRepository extends BaseRepository {
    public getExerciseByUUID(id: string) {
        return this.databaseConnection
            .select()
            .from(exerciseWrapperTable)
            .where(eq(exerciseWrapperTable.id, id));
    }

    /**
     * Loads the exercise with the corresponding trainer id
     */
    public getExerciseByTrainerId(id: string) {
        return this.databaseConnection
            .select()
            .from(exerciseWrapperTable)
            .where(eq(exerciseWrapperTable.trainerId, id));
    }

    /**
     * Loads the exercise with the corresponding participant id
     */
    public getExerciseByParticipantId(id: string) {
        return this.databaseConnection
            .select()
            .from(exerciseWrapperTable)
            .where(eq(exerciseWrapperTable.participantId, id));
    }

    public getAllExercises() {
        return this.databaseConnection.select().from(exerciseWrapperTable);
    }

    public deleteExerciseById(id: string) {
        return this.databaseConnection
            .delete(exerciseWrapperTable)
            .where(eq(exerciseWrapperTable.id, id));
    }

    /**
     * get exercises with outdated state versions
     */
    public async getOutdatedExercises() {
        return this.databaseConnection
            .select()
            .from(exerciseWrapperTable)
            .where(
                lt(
                    exerciseWrapperTable.stateVersion,
                    ExerciseState.currentStateVersion
                )
            );
    }

    public async saveExerciseState(
        exercisePatch: InferInsertModel<typeof exerciseWrapperTable>
    ) {
        const result = await this.databaseConnection
            .insert(exerciseWrapperTable)
            .values(exercisePatch)
            .onConflictDoUpdate({
                target: exerciseWrapperTable.id,
                set: exercisePatch,
            })
            .returning();
        if (result.length > 0 && result[0]?.id !== undefined) {
            // TODO: @Quixelation --> test if this saves the id
            exercisePatch.id = result[0].id;
        }
        return result;
    }
}
