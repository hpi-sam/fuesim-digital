import type { ExerciseAction, ExerciseState } from 'digital-fuesim-manv-shared';
import type { InferSelectModel } from 'drizzle-orm';
import { relations, sql } from 'drizzle-orm';
import {
    char,
    integer,
    pgTable,
    uuid,
    json,
    bigint,
    foreignKey,
    timestamp,
} from 'drizzle-orm/pg-core';

export class BaseEntity {
    public static table = {
        id: uuid()
            .default(sql`uuid_generate_v4()`)
            .primaryKey()
            .notNull(),
    };
}

export const exerciseTable = pgTable('exercise_entity', {
    ...BaseEntity.table,
    tickCounter: integer().default(0).notNull(),
    initialStateString: json().$type<ExerciseState>().notNull(),
    participantId: char({ length: 6 }).notNull(),
    trainerId: char({ length: 8 }).notNull(),
    currentStateString: json().$type<ExerciseState>().notNull(),
    stateVersion: integer().notNull(),
    lastUsedAt: timestamp({ withTimezone: true, mode: 'date' })
        .notNull()
        .defaultNow(),
});
export type ExerciseEntry = InferSelectModel<typeof exerciseTable>;

export const actionTable = pgTable(
    'action_entity',
    {
        id: uuid()
            .default(sql`uuid_generate_v4()`)
            .primaryKey()
            .notNull(),
        emitterId: uuid(),
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        index: bigint({ mode: 'number' }).notNull(),
        actionString: json().$type<ExerciseAction>().notNull(),
        exerciseId: uuid().notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.exerciseId],
            foreignColumns: [exerciseTable.id],
            name: 'FK_180a58767f06b503216ba2b0982',
        })
            .onUpdate('cascade')
            .onDelete('cascade'),
    ]
);
export type ActionEntry = InferSelectModel<typeof actionTable>;

export const actionEntityRelations = relations(actionTable, ({ one }) => ({
    exerciseWrapperEntity: one(exerciseTable, {
        fields: [actionTable.exerciseId],
        references: [exerciseTable.id],
    }),
}));

export const exerciseEntityRelations = relations(exerciseTable, ({ many }) => ({
    actionWrapperEntities: many(actionTable),
}));
