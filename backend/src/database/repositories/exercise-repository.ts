import { ExerciseState } from 'digital-fuesim-manv-shared';
import type { InferInsertModel } from 'drizzle-orm';
import { eq, lt } from 'drizzle-orm';
import type { ExerciseId } from '../schema.js';
import { exerciseTable } from '../schema.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import type {
    ParticipantKey,
    TrainerKey,
} from '../../exercise/exercise-keys.js';
import { BaseRepository } from './base-repository.js';

export class ExerciseRepository extends BaseRepository {
    public getExerciseById(id: ExerciseId) {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.id, id));
    }

    /**
     * Loads the exercise with the corresponding trainer key
     */
    public async getExerciseByTrainerKey(trainerKey: TrainerKey) {
        const dbResult = await this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.trainerId, trainerKey));

        return onlySingle(dbResult);
    }

    /**
     * Loads the exercise with the corresponding participant key
     */
    public async getExerciseByParticipantKey(participantKey: ParticipantKey) {
        const dbResult = await this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.participantId, participantKey));

        return onlySingle(dbResult);
    }

    public getAllExercises() {
        return this.databaseConnection.select().from(exerciseTable);
    }

    public deleteExerciseById(exerciseId: ExerciseId) {
        return this.databaseConnection
            .delete(exerciseTable)
            .where(eq(exerciseTable.id, exerciseId));
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
        exerciseId: ExerciseId,
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

function onlySingle<T>(array: T[]): T | null {
    if (array.length === 0 || array[0] === undefined) {
        return null;
    }
    if (array.length > 1) {
        throw new Error('Multiple entries found where only one expected');
    }
    return array[0];
}
