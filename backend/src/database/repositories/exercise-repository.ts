import { ExerciseState } from 'digital-fuesim-manv-shared';
import type { InferInsertModel } from 'drizzle-orm';
import { eq, lt } from 'drizzle-orm';
import { exerciseTable } from '../schema.js';
import type { ActiveExercise } from '../../exercise/exercise-wrapper.js';
import { BaseRepository } from './base-repository.js';

export class ExerciseRepository extends BaseRepository {
    public getExerciseById(id: string) {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.id, id));
    }

    /**
     * Loads the exercise with the corresponding trainer id
     */
    public getExerciseByTrainerKey(trainerKey: string) {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.trainerId, trainerKey));
    }

    /**
     * Loads the exercise with the corresponding participant id
     */
    public getExerciseByParticipantKey(participantKey: string) {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.participantId, participantKey));
    }

    public getAllExercises() {
        return this.databaseConnection.select().from(exerciseTable);
    }

    public deleteExerciseById(uuid: string) {
        return this.databaseConnection
            .delete(exerciseTable)
            .where(eq(exerciseTable.id, uuid));
    }

    /**
     * get exercises with outdated state versions
     */
    public async getOutdatedExercises() {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(
                lt(
                    exerciseTable.stateVersion,
                    ExerciseState.currentStateVersion
                )
            );
    }

    public async saveExerciseState(
        exerciseId: string,
        exercisePatch: InferInsertModel<typeof exerciseTable>
    ) {
        const exercisePatchWithId = {
            id: exerciseId,
            ...exercisePatch,
        };

        const result = await this.databaseConnection
            .insert(exerciseTable)
            .values(exercisePatchWithId)
            .onConflictDoUpdate({
                target: exerciseTable.id,
                set: exercisePatchWithId,
            })
            .returning();
        return result;
    }

    public async createExerciseIfNotExists(activeExercise: ActiveExercise) {
        const exercise = activeExercise.getExercise();
        return this.databaseConnection
            .insert(exerciseTable)
            .values({
                id: activeExercise.exerciseId,
                currentStateString: exercise.currentStateString,
                initialStateString: exercise.initialStateString,
                tickCounter: exercise.tickCounter,
                stateVersion: exercise.stateVersion,
                trainerId: exercise.trainerId,
                participantId: exercise.participantId,
            })
            .onConflictDoNothing()
            .returning();
    }
}
