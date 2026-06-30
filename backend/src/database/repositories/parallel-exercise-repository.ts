import { eq, desc, getTableColumns } from 'drizzle-orm';
import type {
    ParallelExerciseKey,
    ParallelExerciseId,
} from 'fuesim-digital-shared';
import {
    organisationMembershipTable,
    type ParallelExercise,
    type ParallelExerciseInsert,
} from '../schema.js';
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

    private get parallelExerciseQuery() {
        return this.databaseConnection
            .select(this.getColumns())
            .from(parallelExerciseTable)
            .innerJoin(
                exerciseTemplateTable,
                eq(exerciseTemplateTable.id, parallelExerciseTable.templateId)
            );
    }

    public async getParallelExerciseById(
        id: ParallelExerciseId
    ): Promise<ParallelExercise | null> {
        return this.onlySingle(
            await this.parallelExerciseQuery.where(
                eq(parallelExerciseTable.id, id)
            )
        );
    }

    public async getParallelExerciseByParticipantKey(
        key: ParallelExerciseKey
    ): Promise<ParallelExercise | null> {
        return this.onlySingle(
            await this.parallelExerciseQuery.where(
                eq(parallelExerciseTable.participantKey, key)
            )
        );
    }

    public async getParallelExercisesForUser(
        userId: string
    ): Promise<ParallelExercise[]> {
        const subquery = this.databaseConnection
            .select()
            .from(organisationMembershipTable)
            .where(eq(organisationMembershipTable.userId, userId))
            .as('memberships');
        return this.parallelExerciseQuery
            .innerJoin(
                subquery,
                eq(
                    subquery.organisationId,
                    parallelExerciseTable.organisationId
                )
            )
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
