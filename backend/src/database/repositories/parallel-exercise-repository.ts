import { eq, desc, getTableColumns } from 'drizzle-orm';
import type {
    GroupParticipantKey,
    ParallelExerciseId,
} from 'fuesim-digital-shared';
import type { ParallelExercise, ParallelExerciseInsert } from '../schema.js';
import {
    exerciseTable,
    parallelExerciseTable,
    exerciseTemplateTable,
} from '../schema.js';
import { BaseRepository } from './base-repository.js';

export class ParallelExerciseRepository extends BaseRepository {
    private getColumns() {
        return {
            ...getTableColumns(parallelExerciseTable),
            template: { ...getTableColumns(exerciseTemplateTable) },
        };
    }

    public async getParallelExerciseById(
        id: ParallelExerciseId
    ): Promise<ParallelExercise | null> {
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

    public async getParallelExerciseByParticipantKey(
        key: GroupParticipantKey
    ): Promise<ParallelExercise | null> {
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

    public async getParallelExercisesOfOwner(
        userId: string
    ): Promise<ParallelExercise[]> {
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

    public async updateParallelExercise(
        id: ParallelExerciseId,
        data: Partial<ParallelExerciseInsert>
    ) {
        return this.onlySingle(
            await this.databaseConnection
                .update(parallelExerciseTable)
                .set(data)
                .where(eq(parallelExerciseTable.id, id))
                .returning()
        );
    }

    public deleteParallelExerciseById(id: ParallelExerciseId) {
        return this.databaseConnection
            .delete(parallelExerciseTable)
            .where(eq(parallelExerciseTable.id, id));
    }

    public async getParallelExerciseInstancesById(id: ParallelExerciseId) {
        return this.databaseConnection
            .select()
            .from(exerciseTable)
            .where(eq(exerciseTable.parallelExerciseId, id))
            .orderBy(exerciseTable.createdAt);
    }
}
