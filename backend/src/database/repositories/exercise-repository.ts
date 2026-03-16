import type { ExerciseId, ExerciseTemplateId } from 'fuesim-digital-shared';
import { ExerciseState } from 'fuesim-digital-shared';
import type { InferInsertModel } from 'drizzle-orm';
import { sql, eq, lt, and, isNull, desc } from 'drizzle-orm';
import type { ExerciseTemplateInsert } from '../schema.js';
import { exerciseTable, exerciseTemplateTable } from '../schema.js';
import type { ActiveExercise } from '../../exercise/active-exercise.js';
import { BaseRepository } from './base-repository.js';

export class ExerciseRepository extends BaseRepository {
    public async getExerciseById(id: ExerciseId) {
        return this.onlySingle(
            await this.databaseConnection
                .select()
                .from(exerciseTable)
                .leftJoin(
                    exerciseTemplateTable,
                    eq(exerciseTemplateTable.id, exerciseTable.templateId)
                )
                .where(eq(exerciseTable.id, id))
        );
    }

    public getAllExercises() {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .leftJoin(
                exerciseTemplateTable,
                eq(exerciseTemplateTable.id, exerciseTable.templateId)
            );
    }

    public getAllExercisesOfOwner(userId: string) {
        return this.databaseConnection
            .select({
                id: exerciseTable.id,
                participantKey: exerciseTable.participantKey,
                trainerKey: exerciseTable.trainerKey,
                createdAt: exerciseTable.createdAt,
                lastUsedAt: exerciseTable.lastUsedAt,
                baseTemplate: {
                    id: exerciseTemplateTable.id,
                    name: exerciseTemplateTable.name,
                },
            })
            .from(exerciseTable)
            .leftJoin(
                exerciseTemplateTable,
                eq(exerciseTemplateTable.id, exerciseTable.baseTemplateId)
            )
            .where(
                and(
                    isNull(exerciseTable.templateId),
                    eq(exerciseTable.user, userId)
                )
            )
            .orderBy(desc(exerciseTable.lastUsedAt));
    }

    public getAllExerciseTemplatesOfOwner(userId: string) {
        return this.databaseConnection
            .select({
                id: exerciseTemplateTable.id,
                trainerKey: exerciseTable.trainerKey,
                createdAt: exerciseTemplateTable.createdAt,
                lastExerciseCreatedAt:
                    exerciseTemplateTable.lastExerciseCreatedAt,
                name: exerciseTemplateTable.name,
                description: exerciseTemplateTable.description,
            })
            .from(exerciseTemplateTable)
            .innerJoin(
                exerciseTable,
                eq(exerciseTemplateTable.id, exerciseTable.templateId)
            )
            .where(eq(exerciseTemplateTable.user, userId))
            .orderBy(
                desc(
                    sql<Date>`COALESCE("exercise_template"."lastExerciseCreatedAt", "exercise_template"."createdAt")`
                )
            );
    }

    public async getExerciseTemplateById(id: ExerciseTemplateId) {
        return this.onlySingle(
            await this.databaseConnection
                .select()
                .from(exerciseTemplateTable)
                .innerJoin(
                    exerciseTable,
                    eq(exerciseTemplateTable.id, exerciseTable.templateId)
                )
                .where(eq(exerciseTemplateTable.id, id))
        );
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
                .set(data)
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
            lastUsedAt: new Date(),
        };

        return this.onlySingle(
            await this.databaseConnection
                .insert(exerciseTable)
                .values(exercisePatchWithId)
                .onConflictDoUpdate({
                    target: exerciseTable.id,
                    set: exercisePatchWithId,
                })
                .returning()
        );
    }

    public async createExercise(
        activeExercise: ActiveExercise,
        optionalData?: Partial<InferInsertModel<typeof exerciseTable>>
    ) {
        const exercise = activeExercise.getExercise();
        return this.onlySingle(
            await this.databaseConnection
                .insert(exerciseTable)
                .values({
                    ...(optionalData ?? {}),
                    id: activeExercise.exerciseId,
                    currentStateString: exercise.currentStateString,
                    initialStateString: exercise.initialStateString,
                    tickCounter: exercise.tickCounter,
                    stateVersion: exercise.stateVersion,
                    trainerKey: exercise.trainerKey,
                    participantKey: exercise.participantKey,
                })
                .returning()
        );
    }
}
