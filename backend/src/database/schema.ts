import type { ExerciseAction, ExerciseState } from 'digital-fuesim-manv-shared';
import { relations, sql } from 'drizzle-orm';
import {
    char,
    integer,
    pgTable,
    uuid,
    json,
    bigint,
    foreignKey,
    serial,
    varchar,
} from 'drizzle-orm/pg-core';

export class BaseEntity {
    public static table = {
        id: uuid()
            .default(sql`uuid_generate_v4()`)
            .primaryKey()
            .notNull(),
    };
}

export const exerciseWrapperTable = pgTable('exercise_wrapper_entity', {
    ...BaseEntity.table,
    tickCounter: integer().default(0).notNull(),
    initialStateString: json().$type<ExerciseState>().notNull(),
    participantId: char({ length: 6 }).notNull(),
    trainerId: char({ length: 8 }).notNull(),
    currentStateString: json().$type<ExerciseState>().notNull(),
    stateVersion: integer().notNull(),
});

export const actionWrapperTable = pgTable(
    'action_wrapper_entity',
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
            foreignColumns: [exerciseWrapperTable.id],
            name: 'FK_180a58767f06b503216ba2b0982',
        })
            .onUpdate('cascade')
            .onDelete('cascade'),
    ]
);

export const actionWrapperEntityRelations = relations(
    actionWrapperTable,
    ({ one }) => ({
        exerciseWrapperEntity: one(exerciseWrapperTable, {
            fields: [actionWrapperTable.exerciseId],
            references: [exerciseWrapperTable.id],
        }),
    })
);

export const exerciseWrapperEntityRelations = relations(
    exerciseWrapperTable,
    ({ many }) => ({
        actionWrapperEntities: many(actionWrapperTable),
    })
);
