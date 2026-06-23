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
    MarketplaceElementContent,
    ParallelExerciseId,
    OrganisationId,
    OrganisationMembershipId,
    OrganisationMembershipRole,
    ParallelExerciseKey,
    OrganisationInviteLinkId,
} from 'fuesim-digital-shared';
import { uuid as fuesimUUID } from 'fuesim-digital-shared';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
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
    pgEnum,
    unique,
    index,
    boolean,
    primaryKey,
} from 'drizzle-orm/pg-core';

function typedUUID<T = string>() {
    return uuid().$type<T>();
}
function defaultUUID<T = string>() {
    return typedUUID<T>().$defaultFn(() => fuesimUUID() as T);
}
function defaultPrefixedUUID(prefix: string) {
    return varchar().$defaultFn(() => `${prefix}_${fuesimUUID()}`);
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

export const organisationTable = pgTable(
    'organisation',
    {
        ...baseTable<OrganisationId>(),
        name: varchar().notNull(),
        description: text().notNull().default(''),
        createdAt: timestamp({ withTimezone: true, mode: 'date' })
            .notNull()
            .defaultNow(),
        personalOrganisationOf: varchar().references(() => userTable.id, {
            onDelete: 'cascade',
        }),
    },
    (t) => [unique().on(t.personalOrganisationOf)]
);
export type OrganisationEntry = InferSelectModel<typeof organisationTable>;
export type OrganisationInsert = InferInsertModel<typeof organisationTable>;

const organisationMembershipRoleEnum = pgEnum('organisation_membership_role', [
    'viewer',
    'editor',
    'admin',
]);
export const organisationMembershipTable = pgTable(
    'organisation_membership',
    {
        ...baseTable<OrganisationMembershipId>(),
        userId: varchar()
            .references(() => userTable.id, { onDelete: 'cascade' })
            .notNull(),
        organisationId: uuid()
            .$type<OrganisationId>()
            .references(() => organisationTable.id, { onDelete: 'cascade' })
            .notNull(),
        role: organisationMembershipRoleEnum()
            .$type<OrganisationMembershipRole>()
            .notNull(),
        joinedAt: timestamp({ withTimezone: true, mode: 'date' })
            .notNull()
            .defaultNow(),
    },
    (t) => [
        unique().on(t.userId, t.organisationId),
        index().on(t.organisationId, t.role),
    ]
);
export type OrganisationMembershipEntry = InferSelectModel<
    typeof organisationMembershipTable
>;
export type OrganisationMembershipInsert = InferInsertModel<
    typeof organisationMembershipTable
>;

export const organisationInviteLinkTable = pgTable('organisation_invite_link', {
    ...baseTable<OrganisationInviteLinkId>(),
    token: varchar()
        .notNull()
        .$defaultFn(() => crypto.randomBytes(32).toString('hex')),
    organisationId: uuid()
        .$type<OrganisationId>()
        .references(() => organisationTable.id, { onDelete: 'cascade' })
        .notNull(),
    expirationDate: timestamp({ withTimezone: true, mode: 'date' })
        .notNull()
        .$defaultFn(() => {
            const newDate = new Date();
            newDate.setDate(newDate.getDate() + 7);
            return newDate;
        }),
});
export type OrganisationInviteLinkEntry = InferSelectModel<
    typeof organisationInviteLinkTable
>;
export type OrganisationInviteLinkInsert = InferInsertModel<
    typeof organisationInviteLinkTable
>;

export const exerciseTemplateTable = pgTable('exercise_template', {
    ...baseTable<ExerciseTemplateId>(),
    organisationId: uuid()
        .$type<OrganisationId>()
        .references(() => organisationTable.id, { onDelete: 'cascade' })
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
    participantKey: char({ length: 6 })
        .$type<ParticipantKey>()
        .notNull()
        .unique(),
    trainerKey: char({ length: 8 }).$type<TrainerKey>().notNull().unique(),
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
        unique().on(table.index, table.exerciseId),
    ]
);
export type ActionEntry = InferSelectModel<typeof actionTable>;

function stateVersionedEntity<EntityBrand, VersionBrand>(prefix: string) {
    return {
        // VersionId uniquely indentifies an entry in the entire elements/collections table
        versionId: defaultPrefixedUUID(`${prefix}_version`)
            .unique()
            .notNull()
            .primaryKey()
            .$type<VersionBrand>(),
        // EntityId references a set of multiple versions of an element/collection
        // and is therefore not unique.
        entityId: defaultPrefixedUUID(`${prefix}_entity`)
            .notNull()
            .$type<EntityBrand>(),
        // A natural integer increasing by one with every new version of an element/collection.
        // This is used to easily determine the latest version of an element/collection.
        version: integer().notNull(),
        // Used to determine the data-model version used in the content of an element/collection
        // (for migrations)
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
        ...stateVersionedEntity<CollectionEntityId, CollectionVersionId>(
            'collection'
        ),
        title: varchar().notNull(),
        description: varchar().notNull(),
        visibility: varchar().notNull().default('private'),
        draftState: boolean().notNull(),
        archived: boolean().notNull().default(false),
        // fyi: we cant use computed/generated columns for
        // elementCount here bc we need to access the
        // mappings table (external table lookups are not allowed)
    },
    (table) => [
        // Each Entity (set of multiple versions) should
        // only every have each version number once
        unique('unique_collection_version').on(table.entityId, table.version),
    ]
);

// This table maps each element-version to a collection-version.
//
// An element-version can be mapped to multiple collection-versions of the same collection-entity,
// however there should always be exactly one mapping with isBaseReference=true for a set of
// element-version (1) to (n) collection-entity entries.
//
// isBaseReference in this case means that this mapping points to the collection-version
// in which the associated element-version was originally created / it belongs to.
export const elementCollectionMappingTable = pgTable(
    'element_to_collection_mapping',
    {
        collectionEntityId: varchar().notNull().$type<CollectionEntityId>(),
        collectionVersionId: varchar()
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
        // isBaseReference=true means that the connected element-version was initially created in this collection-version.
        // If this entry belong to the draftState collection version we are currently working on, we can edit this entry directly.
        //
        // isBaseReference=false means that the connected element-version is only referenced in the associated collection-version,
        // but was created for a different collection-version.
        // We can therefore not edit this connected element-version directly but must create a new version of the element onWrite
        // and create a new mapping entry with isBaseReference=true for the new element-version and the current collection-version.
        isBaseReference: boolean().default(false),
    },
    (table) => [
        // Each element-version should only be mapped once to a collection-version.
        // (e.g. Collection A (v1) should not have two mappings to RTW (v1))
        unique('unique_element_collection_mapping').on(
            table.collectionVersionId,
            table.elementVersionId
        ),
        // each collection version should not have multiple mappings to the same element-entity
        // (e.g. Collection A (v1) should not have two mappings to RTW (v1) and RTW (v2) at the same time.
        unique('unique_element_collection_mapping_2').on(
            table.collectionVersionId,
            table.elementEntityId
        ),
    ]
);

export const collectionDependencyMappingTable = pgTable(
    'collection_dependency_mapping',
    {
        // The Parent Collection
        dependentCollectionEntityId: varchar()
            .notNull()
            .$type<CollectionEntityId>(),
        dependentCollectionVersionId: varchar()
            .notNull()
            .$type<CollectionVersionId>()
            .references(() => collectionTable.versionId, {
                onDelete: 'cascade',
            }),
        // Our Dependency
        collectionEntityId: varchar().notNull().$type<CollectionEntityId>(),
        collectionVersionId: varchar()
            .notNull()
            .$type<CollectionVersionId>()
            .references(() => collectionTable.versionId, {
                onDelete: 'cascade',
            }),
    },
    (table) => [
        // Each collection-version should only have one mapping to a specific dependency collection-version.
        // (e.g. Collection A (v1) should not have two mappings to Collection B (v1))
        // +
        // Each collection-version should only have one mapping to a specific dependency collection-entity.
        // (e.g. Collection A (v1) should not have two mappings to Collection B (v1) and Collection B (v2) at the same time.
        //
        // The latter is also enforced since they share an EntityId
        unique('unique_collection_dependency').on(
            table.dependentCollectionVersionId,
            table.collectionEntityId
        ),
    ]
);

export const elementTable = pgTable(
    'elements',
    {
        ...stateVersionedEntity<ElementEntityId, ElementVersionId>('element'),
        title: varchar().notNull(),
        description: varchar().notNull(),
        content: json().$type<MarketplaceElementContent>().notNull(),
    },
    (table) => [
        unique('unique_template_version').on(table.entityId, table.version),
        unique('unique_template_id').on(table.entityId, table.versionId),
    ]
);

export const collectionUserMappingTable = pgTable(
    'collection_user_mapping',
    {
        collection: varchar().notNull().$type<CollectionEntityId>(),
        userId: varchar()
            .notNull()
            .references(() => userTable.id, { onDelete: 'cascade' }),
        role: varchar().notNull().$type<CollectionRelationshipType>(),
    },
    (table) => [primaryKey({ columns: [table.collection, table.userId] })]
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
    participantKey: char({ length: 7 })
        .$type<ParallelExerciseKey>()
        .notNull()
        .unique(),
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
