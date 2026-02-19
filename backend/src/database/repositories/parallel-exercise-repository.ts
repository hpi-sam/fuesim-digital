import { eq, desc, getTableColumns } from 'drizzle-orm';
import type { GroupParticipantKey } from 'fuesim-digital-shared';
import type { ParallelExerciseId, ParallelExerciseInsert } from '../schema.js';
import { parallelExerciseTable, exerciseTemplateTable } from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class ParallelExerciseRepository extends BaseRepository {
    private getColumns() {
        return {
            ...getTableColumns(parallelExerciseTable),
            template: { ...getTableColumns(exerciseTemplateTable) },
        };
    }

    public async getParallelExerciseById(id: ParallelExerciseId) {
        return this.onlySingle(
            await this.databaseConnection
                .select(this.getColumns())
                .from(parallelExerciseTable)
                .innerJoin(
                    exerciseTemplateTable,
                    eq(
                        exerciseTemplateTable.id,
                        parallelExerciseTable.templateId
                    )
                )
                .where(eq(parallelExerciseTable.id, id))
        );
    }

    public async getParallelExerciseByParticipantKey(key: GroupParticipantKey) {
        return this.onlySingle(
            await this.databaseConnection
                .select(this.getColumns())
                .from(parallelExerciseTable)
                .innerJoin(
                    exerciseTemplateTable,
                    eq(
                        exerciseTemplateTable.id,
                        parallelExerciseTable.templateId
                    )
                )
                .where(eq(parallelExerciseTable.participantKey, key))
        );
    }

    public getParallelExercisesOfOwner(userId: string) {
        return this.databaseConnection
            .select(this.getColumns())
            .from(parallelExerciseTable)
            .innerJoin(
                exerciseTemplateTable,
                eq(exerciseTemplateTable.id, parallelExerciseTable.templateId)
            )
            .where(eq(parallelExerciseTable.user, userId))
            .orderBy(desc(parallelExerciseTable.createdAt));
    }

    public async createParallelExercise(data: ParallelExerciseInsert) {
        return this.onlySingle(
            await this.databaseConnection
                .insert(parallelExerciseTable)
                .values(data)
                .returning()
        );
    }

    public deleteParallelExerciseById(id: ParallelExerciseId) {
        return this.databaseConnection
            .delete(parallelExerciseTable)
            .where(eq(parallelExerciseTable.id, id));
    }
}
