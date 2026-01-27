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
    varchar,
    timestamp,
} from 'drizzle-orm/pg-core';

const baseTable = {
    id: uuid()
        .default(sql`uuid_generate_v4()`)
        .primaryKey()
        .notNull(),
};

export const exerciseTable = pgTable('exercise_entity', {
    ...baseTable,
    tickCounter: integer().default(0).notNull(),
    initialStateString: json().$type<ExerciseState>().notNull(),
    participantId: char({ length: 6 }).notNull(),
    trainerId: char({ length: 8 }).notNull(),
    currentStateString: json().$type<ExerciseState>().notNull(),
    stateVersion: integer().notNull(),
});
export type ExerciseEntry = InferSelectModel<typeof exerciseTable>;

export const actionTable = pgTable(
    'action_entity',
    {
        ...baseTable,
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

export const userTable = pgTable('users', {
    /**
     * This should always be the sub claim from the OIDC provider
     */
    id: varchar().primaryKey().notNull(),
    username: varchar().notNull(),
    displayName: varchar().notNull(),
    updatedAt: timestamp({ mode: 'date', precision: 3 })
        .notNull()
        .defaultNow()
        .$onUpdateFn(() => new Date()),
});

export const sessionTable = pgTable('sessions', {
    id: varchar().primaryKey().notNull(),
    userId: varchar()
        .notNull()
        .references(() => userTable.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),
    createdAt: timestamp({ mode: 'date', precision: 3 }).notNull().defaultNow(),
    expiresAt: timestamp({ mode: 'date', precision: 3 }).notNull(),
    accessToken: varchar().notNull(),
});
export type SessionEntry = InferSelectModel<typeof sessionTable>;

export const actionEntityRelations = relations(actionTable, ({ one }) => ({
    exerciseWrapperEntity: one(exerciseTable, {
        fields: [actionTable.exerciseId],
        references: [exerciseTable.id],
    }),
}));

export const exerciseEntityRelations = relations(exerciseTable, ({ many }) => ({
    actionWrapperEntities: many(actionTable),
}));
