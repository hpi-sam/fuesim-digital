import type { ExerciseId, ExerciseTemplateId } from 'fuesim-digital-shared';
import { ExerciseState } from 'fuesim-digital-shared';
import { sql, eq } from 'drizzle-orm';
import type { ExerciseInsert, ExerciseTemplateInsert } from '../schema.js';
import { exerciseTable, exerciseTemplateTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class ExerciseRepository extends BaseRepository {
    public async getExerciseById(id: ExerciseId) {
        return this.databaseConnection.query.exerciseTable.findFirst({
            with: { template: true },
            where: { id: { eq: id } },
        });
    }

    public getAllExercises() {
        return this.databaseConnection.query.exerciseTable.findMany({
            with: { template: true },
        });
    }

    public getAllExercisesOfOwner(userId: string) {
        return this.databaseConnection.query.exerciseTable.findMany({
            with: {
                baseTemplate: {
                    columns: {
                        id: true,
                        name: true,
                    },
                },
            },
            where: {
                templateId: { isNull: true },
                userId,
            },
            orderBy: {
                lastUsedAt: 'desc',
            },
        });
    }

    public getAllExerciseTemplatesOfOwner(userId: string) {
        return this.databaseConnection.query.exerciseTemplateTable.findMany({
            with: {
                exercise: true,
            },
            where: {
                userId,
            },
            orderBy: (t, { desc }) =>
                desc(
                    sql<Date>`COALESCE("lastExerciseCreatedAt", "lastUpdatedAt")`
                ),
        });
    }

    public async getExerciseTemplateById(id: ExerciseTemplateId) {
        return this.databaseConnection.query.exerciseTemplateTable.findFirst({
            with: {
                exercise: true,
            },
            where: {
                id: { eq: id },
            },
        });
    }

    public async createExerciseTemplate(data: ExerciseTemplateInsert) {
        return this.onlySingle(
            await this.databaseConnection
                .insert(exerciseTemplateTable)
                .values(data)
                .returning()
        );
    }

    public async updateExerciseTemplate(
        id: ExerciseTemplateId,
        data: Partial<ExerciseTemplateInsert>
    ) {
        return this.onlySingle(
            await this.databaseConnection
                .update(exerciseTemplateTable)
                .set({ ...data, lastUpdatedAt: new Date() })
                .where(eq(exerciseTemplateTable.id, id))
                .returning()
        );
    }

    public deleteExerciseById(exerciseId: ExerciseId) {
        return this.databaseConnection
            .delete(exerciseTable)
            .where(eq(exerciseTable.id, exerciseId));
    }

    public deleteExerciseTemplateById(id: ExerciseTemplateId) {
        // due to cascade, the connected exercise should be deleted, too
        return this.databaseConnection
            .delete(exerciseTemplateTable)
            .where(eq(exerciseTemplateTable.id, id));
    }

    /**
     * get exercises with outdated state versions
     */
    public async getOutdatedExercises() {
        return this.databaseConnection.query.exerciseTable.findMany({
            where: {
                stateVersion: { lt: ExerciseState.currentStateVersion },
            },
        });
    }

    public async saveExerciseState(exercise: ExerciseInsert) {
        const exercisePatch = {
            ...exercise,
            lastUsedAt: new Date(),
        };

        return this.onlySingle(
            await this.databaseConnection
                .insert(exerciseTable)
                .values(exercisePatch)
                .onConflictDoUpdate({
                    target: exerciseTable.id,
                    set: exercisePatch,
                })
                .returning()
        );
    }

    public async createExercise(exercise: ExerciseInsert) {
        return this.onlySingle(
            await this.databaseConnection
                .insert(exerciseTable)
                .values(exercise)
                .returning()
        );
    }
}
