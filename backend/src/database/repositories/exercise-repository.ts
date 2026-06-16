import type { ExerciseId, ExerciseTemplateId } from 'fuesim-digital-shared';
import { ExerciseState } from 'fuesim-digital-shared';
import { getTableColumns, sql, eq, lt, and, isNull, desc } from 'drizzle-orm';
import {
    actionTable,
    type ExerciseInsert,
    type ExerciseTemplateInsert,
} from '../schema.js';
import { exerciseTable, exerciseTemplateTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class ExerciseRepository extends BaseRepository {
    private get exerciseTemplateQuery() {
        return this.databaseConnection
            .select({
                ...getTableColumns(exerciseTemplateTable),
                trainerKey: exerciseTable.trainerKey,
                exercise: { ...getTableColumns(exerciseTable) },
            })
            .from(exerciseTemplateTable)
            .innerJoin(
                exerciseTable,
                eq(exerciseTemplateTable.id, exerciseTable.templateId)
            );
    }

    private getExerciseQuery(withActionsCount: boolean = false) {
        return this.databaseConnection
            .select({
                ...getTableColumns(exerciseTable),
                template: {
                    ...getTableColumns(exerciseTemplateTable),
                },
                ...(withActionsCount
                    ? {
                          actionsCount: this.databaseConnection.$count(
                              actionTable,
                              eq(actionTable.exerciseId, exerciseTable.id)
                          ),
                      }
                    : {}),
            })
            .from(exerciseTable)
            .leftJoin(
                exerciseTemplateTable,
                eq(exerciseTemplateTable.id, exerciseTable.templateId)
            );
    }

    public async getExerciseById(id: ExerciseId) {
        return this.onlySingle(
            await this.getExerciseQuery().where(eq(exerciseTable.id, id))
        );
    }

    public getAllExercisesWithActionsCount() {
        return this.getExerciseQuery(true);
    }

    public getAllExercisesOfOwner(userId: string) {
        return this.databaseConnection
            .select({
                ...getTableColumns(exerciseTable),
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
        return this.exerciseTemplateQuery
            .where(eq(exerciseTemplateTable.user, userId))
            .orderBy(
                desc(
                    sql<Date>`COALESCE("exercise_template"."lastExerciseCreatedAt", "exercise_template"."lastUpdatedAt")`
                )
            );
    }

    public async getExerciseTemplateById(id: ExerciseTemplateId) {
        return this.onlySingle(
            await this.exerciseTemplateQuery.where(
                eq(exerciseTemplateTable.id, id)
            )
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
        exercise: ExerciseInsert & { id: ExerciseId }
    ) {
        const {
            currentStateString,
            initialStateString,
            stateVersion,
            id,
            tickCounter,
        } = exercise;
        const exercisePatch = {
            currentStateString,
            initialStateString,
            stateVersion,
            tickCounter,
            lastUsedAt: new Date(),
        };

        return this.onlySingle(
            await this.databaseConnection
                .update(exerciseTable)
                .set(exercisePatch)
                .where(eq(exerciseTable.id, id))
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
