import type {
    ActionId,
    CollectionEntityId,
    CollectionRelationshipType,
    CollectionVersionId,
    ElementEntityId,
    ElementVersionId,
    ExerciseAction,
    ExerciseId,
    ExerciseState,
    ExerciseTemplateId,
    ParticipantKey,
    AccessKey,
    TrainerKey,
    VersionedElementContent,
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
    unique,
    text,
    boolean,
} from 'drizzle-orm/pg-core';

function typedUUID<T = string>() {
    return uuid().$type<T>();
}
function defaultUUID<T = string>() {
    return typedUUID<T>().default(sql`uuid_generate_v4()`);
}
function defaultPrefixedUUID(prefix: string) {
    return varchar().$defaultFn(() => `${prefix}_${crypto.randomUUID()}`);
}

function baseTable<T>() {
    return {
        id: defaultUUID<T>().primaryKey().notNull(),
    };
}

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
    lastUpdatedAt: timestamp({ withTimezone: true, mode: 'date' })
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

function stateVersionedEntity<EntityBrand, VersionBrand>(prefix: string) {
    return {
        versionId: defaultPrefixedUUID(`${prefix}_version`)
            .unique()
            .notNull()
            .primaryKey()
            .$type<VersionBrand>(),
        entityId: defaultPrefixedUUID(`${prefix}_entity`)
            .notNull()
            .$type<EntityBrand>(),
        version: integer().notNull(),
        stateVersion: integer().notNull(),
        createdAt: timestamp({ withTimezone: true, mode: 'date' })
            .defaultNow()
            .notNull(),
        editedAt: timestamp({ withTimezone: true, mode: 'date' })
            .$onUpdateFn(() => new Date())
            .defaultNow()
            .notNull(),
    };
}

export const collectionTable = pgTable(
    'collections',
    {
        ...stateVersionedEntity<CollectionEntityId, CollectionVersionId>('set'),
        title: varchar().notNull(),
        description: varchar().notNull(),
        visibility: varchar().notNull().default('private'),
        draftState: boolean().notNull(),
        archived: boolean().notNull().default(false),
        // This is just easier for everybody
        elementCount: integer().notNull().default(0),
    },
    (table) => [
        unique('unique_set_version').on(table.entityId, table.version),
        unique('unique_set_id').on(table.entityId, table.versionId),
    ]
);

export const elementCollectionMappingTable = pgTable(
    'element_to_collection_mapping',
    {
        setEntityId: varchar().notNull().$type<CollectionEntityId>(),
        setVersionId: varchar()
            .notNull()
            .$type<CollectionVersionId>()
            .references(() => collectionTable.versionId, {
                onDelete: 'cascade',
            }),
        elementEntityId: varchar().notNull().$type<ElementEntityId>(),
        elementVersionId: varchar()
            .notNull()
            .$type<ElementVersionId>()
            .references(() => elementTable.versionId, {
                onDelete: 'cascade',
            }),
        isBaseReference: boolean().default(false),
    },
    (table) => [
        unique('unique_element_set_mapping').on(
            table.setVersionId,
            table.elementVersionId
        ),
        unique('unique_element_set_mapping_2').on(
            table.setVersionId,
            table.elementEntityId
        ),
    ]
);

export const collectionDependencyMappingTable = pgTable(
    'collection_dependency_mapping',
    {
        collectionEntityId: varchar().notNull().$type<CollectionEntityId>(),
        collectionVersionId: varchar()
            .notNull()
            .$type<CollectionVersionId>()
            .references(() => collectionTable.versionId, {
                onDelete: 'cascade',
            }),
        dependentCollectionEntityId: varchar()
            .notNull()
            .$type<CollectionEntityId>(),
        dependentCollectionVersionId: varchar()
            .notNull()
            .$type<CollectionVersionId>()
            .references(() => collectionTable.versionId, {
                onDelete: 'cascade',
            }),
    },
    (table) => [
        unique('unique_collection_dependency').on(
            table.collectionVersionId,
            table.dependentCollectionVersionId
        ),
    ]
);

export const elementTable = pgTable(
    'elements',
    {
        ...stateVersionedEntity<ElementEntityId, ElementVersionId>('element'),
        title: varchar().notNull(),
        description: varchar().notNull(),
        content: json().$type<VersionedElementContent>().notNull(),
    },
    (table) => [
        unique('unique_template_version').on(table.entityId, table.version),
        unique('unique_template_id').on(table.entityId, table.versionId),
    ]
);

export const collectionUserMappingTable = pgTable(
    'collection_user_mapping',
    {
        id: defaultUUID().primaryKey().notNull(),
        collection: varchar().notNull().$type<CollectionEntityId>(),
        userId: varchar()
            .notNull()
            .references(() => userTable.id, { onDelete: 'cascade' }),
        role: varchar().notNull().$type<CollectionRelationshipType>(),
    },
    (table) => [
        unique('unique_collection_user').on(table.userId, table.collection),
    ]
);

export const collectionJoinCodesTable = pgTable('collection_join_codes', {
    code: varchar().primaryKey().notNull(),
    collection: varchar().notNull().unique().$type<CollectionEntityId>(),
    expiresAt: timestamp({ withTimezone: true, mode: 'date' }).notNull(),
});

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
    name: varchar().notNull(),
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
export interface ParallelExercise extends ParallelExerciseEntry {
    template: ExerciseTemplateEntry;
}
