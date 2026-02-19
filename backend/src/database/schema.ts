import type {
    ActionId,
    ExerciseAction,
    ExerciseId,
    ExerciseState,
    ExerciseTemplateId,
    ParticipantKey,
    AccessKey,
    TrainerKey,
    GroupParticipantKey,
    ParallelExerciseId,
} from 'fuesim-digital-shared';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
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
    text,
} from 'drizzle-orm/pg-core';

const typedUUID = <T>() => uuid().$type<T>();

const baseTable = <T>() => ({
    id: typedUUID<T>()
        .default(sql`uuid_generate_v4()`)
        .primaryKey()
        .notNull(),
});

export const accessKeyTable = pgTable('access_key', {
    key: varchar().$type<AccessKey>().primaryKey().notNull(),
});

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

export const exerciseTemplateTable = pgTable('exercise_template', {
    ...baseTable<ExerciseTemplateId>(),
    user: varchar()
        .references(() => userTable.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' })
        .notNull()
        .defaultNow(),
    lastExerciseCreatedAt: timestamp({
        withTimezone: true,
        mode: 'date',
    }),
    name: varchar().notNull(),
    description: text().notNull().default(''),
});
export type ExerciseTemplateEntry = InferSelectModel<
    typeof exerciseTemplateTable
>;
export type ExerciseTemplateInsert = InferInsertModel<
    typeof exerciseTemplateTable
>;

export const exerciseTable = pgTable('exercise_entity', {
    ...baseTable<ExerciseId>(),
    tickCounter: integer().default(0).notNull(),
    initialStateString: json().$type<ExerciseState>().notNull(),
    participantKey: char({ length: 6 }).$type<ParticipantKey>().notNull(),
    trainerKey: char({ length: 8 }).$type<TrainerKey>().notNull(),
    currentStateString: json().$type<ExerciseState>().notNull(),
    stateVersion: integer().notNull(),
    user: varchar().references(() => userTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true, mode: 'date' })
        .notNull()
        .defaultNow(),
    lastUsedAt: timestamp({ withTimezone: true, mode: 'date' })
        .notNull()
        .defaultNow(),
    // by setting a templateId this exercise will be an exercise template
    templateId: uuid()
        .$type<ExerciseTemplateId>()
        .references(() => exerciseTemplateTable.id, {
            onDelete: 'cascade',
        }),
    baseTemplateId: uuid()
        .$type<ExerciseTemplateId>()
        .references(() => exerciseTemplateTable.id, {
            onDelete: 'set null',
        }),
    parallelExerciseId: uuid()
        .$type<ParallelExerciseId>()
        .references(() => parallelExerciseTable.id, {
            onDelete: 'cascade',
        }),
});
export type ExerciseEntry = InferSelectModel<typeof exerciseTable>;
export type ExerciseInsert = InferInsertModel<typeof exerciseTable>;

export const actionTable = pgTable(
    'action_entity',
    {
        ...baseTable<ActionId>(),
        emitterId: uuid(),
        // You can use { mode: "bigint" } if numbers are exceeding js number limitations
        index: bigint({ mode: 'number' }).notNull(),
        actionString: json().$type<ExerciseAction>().notNull(),
        exerciseId: typedUUID<ExerciseId>().notNull(),
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

export const parallelExerciseTable = pgTable('parallel_exercise', {
    ...baseTable<ParallelExerciseId>(),
    user: varchar()
        .references(() => userTable.id, { onDelete: 'cascade' })
        .notNull(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' })
        .notNull()
        .defaultNow(),
    templateId: uuid()
        // TODO Cascade dangerous?
        .references(() => exerciseTemplateTable.id, { onDelete: 'cascade' })
        .notNull(),
    participantKey: char({ length: 7 }).$type<GroupParticipantKey>().notNull(),
    // Participants will join this viewport
    joinViewportId: uuid().notNull(),
});
export type ParallelExerciseEntry = InferSelectModel<
    typeof parallelExerciseTable
>;
export type ParallelExerciseInsert = InferInsertModel<
    typeof parallelExerciseTable
>;
