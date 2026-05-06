import crypto from 'node:crypto';
import type {
    CollectionDto,
    CollectionEntityId,
    CollectionRelationshipType,
    CollectionVersionId,
    CollectionVisibility,
    ElementDto,
    ElementEntityId,
    ElementVersionId,
    ExtendedCollectionDto,
    Marketplace,
    VersionedElementContent,
    VersionedElementPartial,
} from 'fuesim-digital-shared';
import {
    collectionRelationshipTypeAllowedValues,
    ExerciseState,
} from 'fuesim-digital-shared';
import type { InferInsertModel, SQL } from 'drizzle-orm';
import {
    eq,
    desc,
    getTableColumns,
    sql,
    and,
    max,
    gt,
    inArray,
} from 'drizzle-orm';
import {
    collectionDependencyMappingTable,
    elementCollectionMappingTable,
    collectionTable,
    elementTable,
    collectionJoinCodesTable,
    collectionUserMappingTable,
    userTable,
} from '../schema.js';
import { defaultCollectionData } from '../default-data/collection-default-data.js';
import { BaseRepository } from './base-repository.js';

export class CollectionRepository extends BaseRepository {
    public readonly INVITE_CODE_VALIDITY_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 DAYS

    public async setDefaultCollectionData() {
        await this.transaction(async (tx) => {
            // This is slow with seperate queries, but we dont have that much default data and it is only run once,
            // so it should be fine for now :3

            // CLEANUP existing default data to avoid conflicts
            const existingCollections = await tx.databaseConnection
                .select()
                .from(collectionTable)
                .where(eq(collectionTable.visibility, 'embedded'));

            const existingConnections = await tx.databaseConnection
                .select()
                .from(elementCollectionMappingTable)
                .where(
                    inArray(
                        elementCollectionMappingTable.setVersionId,
                        existingCollections.map((c) => c.versionId)
                    )
                );

            await Promise.all(
                existingConnections.map(async (connections) => {
                    await tx.databaseConnection
                        .delete(elementTable)
                        .where(
                            eq(
                                elementTable.versionId,
                                connections.elementVersionId
                            )
                        );
                    await tx.databaseConnection
                        .delete(elementCollectionMappingTable)
                        .where(
                            eq(
                                elementCollectionMappingTable.elementVersionId,
                                connections.elementVersionId
                            )
                        );
                })
            );

            await Promise.all(
                defaultCollectionData.map(async (collection) => {
                    const dataToInsert: InferInsertModel<
                        typeof collectionTable
                    > = {
                        entityId: collection.entityId,
                        versionId: collection.versionId,
                        title: collection.title,
                        description: collection.description,
                        archived: collection.archived,
                        createdAt: collection.createdAt,
                        editedAt: collection.editedAt,
                        draftState: collection.draftState,
                        elementCount: collection.elementCount,
                        version: collection.version,
                        visibility: collection.visibility,
                        stateVersion: ExerciseState.currentStateVersion,
                    };
                    await tx.databaseConnection
                        .insert(collectionTable)
                        .values(dataToInsert)
                        .onConflictDoUpdate({
                            target: collectionTable.versionId,
                            set: dataToInsert,
                        });
                })
            );

            await Promise.all(
                defaultCollectionData.map(async (collection) =>
                    collection.elements.map(async (element) => {
                        const elementDataToInsert: InferInsertModel<
                            typeof elementTable
                        > = {
                            versionId: element.versionId,
                            entityId: element.entityId,
                            version: element.version,
                            stateVersion: ExerciseState.currentStateVersion,
                            createdAt: element.createdAt,
                            editedAt: element.editedAt,
                            title: element.title,
                            description: element.description,
                            content: element.content,
                        };
                        const createdElement = this.onlySingleStrict(
                            await tx.databaseConnection
                                .insert(elementTable)
                                .values(elementDataToInsert)
                                .onConflictDoUpdate({
                                    target: elementTable.versionId,
                                    set: elementDataToInsert,
                                })
                                .returning()
                        );
                        await tx.databaseConnection
                            .insert(elementCollectionMappingTable)
                            .values({
                                setEntityId: collection.entityId,
                                setVersionId: collection.versionId,
                                elementEntityId: createdElement.entityId,
                                elementVersionId: createdElement.versionId,
                                isBaseReference: true,
                            });
                    })
                )
            );
        });

        console.log(
            '[CollectionRepository]: Default collection data has been set'
        );
    }

    public async getJoinCode(collectionEntitiyId: CollectionEntityId) {
        return this.onlySingle(
            await this.databaseConnection
                .select()
                .from(collectionJoinCodesTable)
                .where(
                    eq(collectionJoinCodesTable.collection, collectionEntitiyId)
                )
        );
    }

    public async getOrCreateJoinCode(collectionEntitiyId: CollectionEntityId) {
        const existingCode = await this.getJoinCode(collectionEntitiyId);
        if (existingCode && existingCode.expiresAt > new Date()) {
            return existingCode;
        }
        const newCode = crypto
            .randomBytes(8)
            .toString('base64url')
            .replaceAll(' ', '-');

        return this.onlySingleStrict(
            await this.databaseConnection
                .insert(collectionJoinCodesTable)
                .values({
                    expiresAt: new Date(
                        Date.now() + this.INVITE_CODE_VALIDITY_DURATION_MS
                    ),
                    code: newCode,
                    collection: collectionEntitiyId,
                })
                .returning()
        );
    }

    public async revokeJoinCode(collectionEntitiyId: CollectionEntityId) {
        return this.databaseConnection
            .delete(collectionJoinCodesTable)
            .where(
                eq(collectionJoinCodesTable.collection, collectionEntitiyId)
            );
    }

    public async getCollectionByJoinCode(
        code: string
    ): Promise<CollectionEntityId | null> {
        return (
            this.onlySingle(
                await this.databaseConnection
                    .select()
                    .from(collectionJoinCodesTable)
                    .where(
                        and(
                            eq(collectionJoinCodesTable.code, code),
                            gt(collectionJoinCodesTable.expiresAt, new Date())
                        )
                    )
            )?.collection ?? null
        );
    }

    public async getUserRoleInCollection(
        collectionEntityId: CollectionEntityId,
        userId: string
    ): Promise<CollectionRelationshipType | null> {
        const latestCollectionVersionNumbers =
            this.latestCollectionVersionNumbers({
                allowDraftState: true,
            });

        const data = await Promise.all([
            await this.databaseConnection
                .with(latestCollectionVersionNumbers)
                .select(getTableColumns(collectionTable))
                .from(collectionTable)
                .innerJoin(
                    latestCollectionVersionNumbers,
                    and(
                        eq(
                            collectionTable.entityId,
                            latestCollectionVersionNumbers.entityId
                        ),
                        eq(
                            collectionTable.version,
                            latestCollectionVersionNumbers.latestversion
                        )
                    )
                )
                .where(eq(collectionTable.entityId, collectionEntityId)),
            await this.databaseConnection
                .select({ role: collectionUserMappingTable.role })
                .from(collectionUserMappingTable)
                .where(
                    and(
                        eq(collectionUserMappingTable.userId, userId),
                        eq(
                            collectionUserMappingTable.collection,
                            collectionEntityId
                        )
                    )
                ),
        ]);

        const collectionData = this.onlySingle(data[0]);
        const userRoleMapping = this.onlySingle(data[1]);

        if (userRoleMapping) return userRoleMapping.role;
        if (
            collectionData &&
            ['public', 'embedded'].includes(collectionData.visibility)
        )
            return 'other';

        return null;
    }

    public async getCollectionMembers(collectionEntityId: CollectionEntityId) {
        return this.databaseConnection
            .select({
                id: userTable.id,
                displayName: userTable.displayName,
                role: collectionUserMappingTable.role,
            })
            .from(collectionUserMappingTable)
            .innerJoin(
                userTable,
                eq(collectionUserMappingTable.userId, userTable.id)
            )
            .where(
                eq(collectionUserMappingTable.collection, collectionEntityId)
            );
    }

    public async removeCollectionMember(
        collectionEntityId: CollectionEntityId,
        userId: string
    ) {
        return this.databaseConnection
            .delete(collectionUserMappingTable)
            .where(
                and(
                    eq(
                        collectionUserMappingTable.collection,
                        collectionEntityId
                    ),
                    eq(collectionUserMappingTable.userId, userId)
                )
            );
    }

    private latestCollectionVersionNumbers(opts: {
        allowDraftState?: boolean;
    }) {
        return this.databaseConnection.$with('latestSetVersionNumbersView').as(
            this.databaseConnection
                .select({
                    entityId: collectionTable.entityId,
                    latestversion: max(collectionTable.version).as(
                        'latestversion'
                    ),
                })
                .from(collectionTable)
                .where(
                    opts.allowDraftState !== true
                        ? eq(collectionTable.draftState, false)
                        : sql`true`
                )
                .groupBy(collectionTable.entityId)
        );
    }

    private latestElementVersionNumbers() {
        return this.databaseConnection
            .$with('latest_exercise_element_template_version_numbers')
            .as(
                this.databaseConnection
                    .select({
                        entityId: elementTable.entityId,
                        latestversion: max(elementTable.version).as(
                            'latestversion'
                        ),
                    })
                    .from(elementTable)
                    .groupBy(elementTable.entityId)
            );
    }

    private latestCollections(opts: { allowDraftState?: boolean }) {
        const latestCollectionVersionNumbers =
            this.latestCollectionVersionNumbers({
                allowDraftState: opts.allowDraftState,
            });

        return this.databaseConnection.$with('latestCollectionsView').as(
            this.databaseConnection
                .with(latestCollectionVersionNumbers)
                .select(getTableColumns(collectionTable))
                .from(collectionTable)
                .innerJoin(
                    latestCollectionVersionNumbers,
                    and(
                        eq(
                            collectionTable.entityId,
                            latestCollectionVersionNumbers.entityId
                        ),
                        eq(
                            collectionTable.version,
                            latestCollectionVersionNumbers.latestversion
                        )
                    )
                )
        );
    }

    private latestElements() {
        const latestElementVersionNumbers = this.latestElementVersionNumbers();

        return this.databaseConnection
            .$with('latest_exercise_element_templates')
            .as(
                this.databaseConnection
                    .with(latestElementVersionNumbers)
                    .select(getTableColumns(elementTable))
                    .from(elementTable)
                    .innerJoin(
                        latestElementVersionNumbers,
                        and(
                            eq(
                                elementTable.entityId,
                                latestElementVersionNumbers.entityId
                            ),
                            eq(
                                elementTable.version,
                                latestElementVersionNumbers.latestversion
                            )
                        )
                    )
            );
    }

    public async getOrCreateDraftState(
        collectionEntityId: CollectionEntityId
    ): Promise<[CollectionDto, boolean]> {
        const result = this.onlySingle(
            await this.databaseConnection
                .select()
                .from(collectionTable)
                .where(
                    and(
                        eq(collectionTable.entityId, collectionEntityId),
                        eq(collectionTable.draftState, true)
                    )
                )
        );

        if (result === null) {
            const latestVersion = this.strict(
                await this.getLatestCollectionByEntityId(collectionEntityId)
            );

            const newCollection = this.onlySingleStrict(
                await this.databaseConnection
                    .insert(collectionTable)
                    .values({
                        ...latestVersion,
                        versionId: undefined, // versionId will be generated by the database
                        version: latestVersion.version + 1,
                        draftState: true,
                        visibility: 'private',
                    })
                    .returning()
            );

            await this.copyReferencesBetweenCollections(
                latestVersion.versionId,
                newCollection.versionId
            );

            await this.copyDependenciesBetweenCollections({
                sourceVersion: latestVersion.versionId,
                targetVersion: newCollection.versionId,
            });

            return [newCollection, true];
        }

        return [this.strict(result), false];
    }

    public async getCollectionVersionDirectDependencies(
        collectionVersionId: CollectionVersionId
    ) {
        const data = await this.databaseConnection
            .select()
            .from(collectionDependencyMappingTable)
            .where(
                eq(
                    collectionDependencyMappingTable.dependentCollectionVersionId,
                    collectionVersionId
                )
            );

        return data;
    }

    public async getParentCollectionsOfCollectionVersion(
        collectionEntityId: CollectionEntityId,
        recursive: boolean = false
    ): Promise<CollectionEntityId[]> {
        const data = await this.databaseConnection
            .select()
            .from(collectionDependencyMappingTable)
            .where(
                eq(
                    collectionDependencyMappingTable.collectionEntityId,
                    collectionEntityId
                )
            );

        const parentCollections = [
            ...data.map((d) => d.dependentCollectionEntityId),
        ];
        if (recursive) {
            await Promise.all(
                data.map(async (dependency) => {
                    const parentParents =
                        await this.getParentCollectionsOfCollectionVersion(
                            dependency.dependentCollectionEntityId,
                            true
                        );
                    parentCollections.push(...parentParents);
                })
            );
        }

        return parentCollections;
    }

    public async removeCollectionVersionDependency(
        dependentCollectionVersionId: CollectionVersionId,
        dependencyCollectionVersionId: CollectionVersionId
    ) {
        return this.databaseConnection
            .delete(collectionDependencyMappingTable)
            .where(
                and(
                    eq(
                        collectionDependencyMappingTable.dependentCollectionVersionId,
                        dependentCollectionVersionId
                    ),
                    eq(
                        collectionDependencyMappingTable.collectionVersionId,
                        dependencyCollectionVersionId
                    )
                )
            );
    }

    public async addCollectionVersionDependency(
        dependentCollectionVersionId: CollectionVersionId,
        dependencyCollectionVersionId: CollectionVersionId
    ) {
        const dependent = this.strict(
            await this.getCollectionByVersionId(dependentCollectionVersionId)
        );
        const dependency = this.strict(
            await this.getCollectionByVersionId(dependencyCollectionVersionId)
        );

        return this.onlySingle(
            await this.databaseConnection
                .insert(collectionDependencyMappingTable)
                .values({
                    collectionVersionId: dependency.versionId,
                    collectionEntityId: dependency.entityId,
                    dependentCollectionVersionId: dependent.versionId,
                    dependentCollectionEntityId: dependent.entityId,
                })
                .returning()
        );
    }

    private async checkElementVersionEditable(
        elementVersionId: ElementVersionId
    ) {
        const mappings = await this.databaseConnection
            .select()
            .from(elementCollectionMappingTable)
            .innerJoin(
                collectionTable,
                eq(
                    elementCollectionMappingTable.setVersionId,
                    collectionTable.versionId
                )
            )
            .where(
                eq(
                    elementCollectionMappingTable.elementVersionId,
                    elementVersionId
                )
            );

        return (
            mappings.length > 0 && // the elements needs to exist to be editable/updateable
            mappings.every((mapping) => mapping.collections.draftState)
        );
    }

    public async updateCollectionData(
        collectionVersionId: CollectionVersionId,
        data: Marketplace.Collection.EditableCollectionProperties
    ) {
        const collection = this.strict(
            await this.getCollectionByVersionId(collectionVersionId)
        );
        if (!collection.draftState) {
            throw new Error(
                'Cannot edit collection that is not in draft state'
            );
        }

        return this.onlySingle(
            await this.databaseConnection
                .update(collectionTable)
                .set({
                    title: data.title,
                    description: data.description,
                })
                .where(eq(collectionTable.versionId, collectionVersionId))
                .returning()
        );
    }

    public async updateElementContent(
        elementVersionId: ElementVersionId,
        data: VersionedElementContent
    ): Promise<ElementDto | null> {
        return this.databaseConnection.transaction(async (tx) => {
            const isEditable =
                await this.checkElementVersionEditable(elementVersionId);
            if (!isEditable) {
                throw new Error(
                    'Cannot edit element version that is part of a non-draft collection'
                );
            }

            const result = await tx
                .update(elementTable)
                .set({
                    content: data,
                    title: data.name,
                })
                .where(eq(elementTable.versionId, elementVersionId))
                .returning();

            return this.onlySingle(result);
        });
    }

    public async saveDraftState(collectionEntityId: CollectionEntityId) {
        const result = await this.databaseConnection
            .update(collectionTable)
            .set({ draftState: false })
            .where(
                and(
                    eq(collectionTable.entityId, collectionEntityId),
                    eq(collectionTable.draftState, true)
                )
            )
            .returning();

        return this.onlySingleStrict(result);
    }

    public async revertDraftState(collectionEntityId: CollectionEntityId) {
        return this.databaseConnection.transaction(async (tx) => {
            // we need to fetch this before getting deletedElements
            // because of the foreign key constraint on elementCollectionMappingTable,
            // which would delete the mappings before we can get them
            const draftStateToBeDeleted = this.onlySingle(
                await tx
                    .select()
                    .from(collectionTable)
                    .where(
                        and(
                            eq(collectionTable.entityId, collectionEntityId),
                            eq(collectionTable.draftState, true)
                        )
                    )
            );

            if (!draftStateToBeDeleted)
                throw new Error('No draft state found to be deleted');

            const deletedElementMappings = await tx
                .delete(elementCollectionMappingTable)
                .where(
                    and(
                        eq(
                            elementCollectionMappingTable.setVersionId,
                            draftStateToBeDeleted.versionId
                        ),
                        // Only delete mappings for element-versions that
                        // are only referenced in this collection version
                        eq(elementCollectionMappingTable.isBaseReference, true)
                    )
                )
                .returning();

            const result = this.onlySingle(
                await tx
                    .delete(collectionTable)
                    .where(
                        and(
                            eq(collectionTable.entityId, collectionEntityId),
                            eq(collectionTable.draftState, true)
                        )
                    )
                    .returning()
            );

            if (!result) throw new Error('No draft state found to be deleted');

            await tx
                .delete(collectionDependencyMappingTable)
                .where(
                    eq(
                        collectionDependencyMappingTable.dependentCollectionVersionId,
                        result.versionId
                    )
                );

            await Promise.all(
                deletedElementMappings.map((m) =>
                    tx
                        .delete(elementTable)
                        .where(eq(elementTable.versionId, m.elementVersionId))
                )
            );

            return result;
        });
    }

    public async setUserCollectionRelationship(
        userId: string,
        collectionEntityId: CollectionEntityId,
        relationship: CollectionRelationshipType,
        opts?: { allowDowngrade?: boolean }
    ) {
        const existingRelationship = this.onlySingle(
            await this.databaseConnection
                .select()
                .from(collectionUserMappingTable)
                .where(
                    and(
                        eq(
                            collectionUserMappingTable.collection,
                            collectionEntityId
                        ),
                        eq(collectionUserMappingTable.userId, userId)
                    )
                )
        );

        if (existingRelationship) {
            const existingIndex =
                collectionRelationshipTypeAllowedValues.indexOf(
                    existingRelationship.role
                );
            if (existingIndex === -1) {
                throw new Error(
                    `Invalid existing relationship role ${existingRelationship.role}`
                );
            }

            const newIndex =
                collectionRelationshipTypeAllowedValues.indexOf(relationship);
            if (newIndex === -1) {
                throw new Error(
                    `Invalid new relationship role ${relationship}`
                );
            }

            if (newIndex < existingIndex && opts?.allowDowngrade !== true) {
                throw new Error(
                    `Cannot downgrade relationship from ${existingRelationship.role} to ${relationship} without allowDowngrade flag`
                );
            }

            return this.databaseConnection
                .update(collectionUserMappingTable)
                .set({
                    role: relationship,
                })
                .where(
                    and(
                        eq(
                            collectionUserMappingTable.id,
                            existingRelationship.id
                        )
                    )
                );
        }

        return this.databaseConnection
            .insert(collectionUserMappingTable)
            .values({
                collection: collectionEntityId,
                userId,
                role: relationship,
            });
    }

    public async createFirstCollectionVersion(
        title: string,
        draftState: boolean = false
    ) {
        const result = await this.databaseConnection
            .insert(collectionTable)
            .values({
                title,
                description: '',
                stateVersion: ExerciseState.currentStateVersion,
                version: 1,
                visibility: 'private',
                draftState,
            })
            .returning();

        return this.onlySingleStrict(result);
    }

    public async createElementVersion(data: {
        content: VersionedElementContent;
        version: number;
        entityId?: ElementEntityId;
    }) {
        const result = await this.databaseConnection
            .insert(elementTable)
            .values({
                version: data.version,
                stateVersion: ExerciseState.currentStateVersion,
                title: data.content.name,
                description: '',
                content: data.content,
                entityId: data.entityId,
            })
            .returning();

        return this.onlySingle(result);
    }

    public async getElementCollectionMapping(
        elementVersionId: ElementVersionId,
        collectionVersionId: CollectionVersionId
    ) {
        return this.onlySingleStrict(
            await this.databaseConnection
                .select()
                .from(elementCollectionMappingTable)
                .where(
                    and(
                        eq(
                            elementCollectionMappingTable.elementVersionId,
                            elementVersionId
                        ),
                        eq(
                            elementCollectionMappingTable.setVersionId,
                            collectionVersionId
                        )
                    )
                )
        );
    }

    public async addElementToCollection(
        elementVersionId: ElementVersionId,
        collectionVersionId: CollectionVersionId,
        isBaseReference: boolean = true
    ) {
        // Check if the Set is in draft state, otherwise we cannot add the element to it
        const set = this.onlySingleStrict(
            await this.databaseConnection
                .select()
                .from(collectionTable)
                .where(eq(collectionTable.versionId, collectionVersionId))
        );

        if (!set.draftState) {
            throw new Error(
                'Can only add exercise objects to sets in draft state'
            );
        }

        const element = this.onlySingleStrict(
            await this.databaseConnection
                .select()
                .from(elementTable)
                .where(eq(elementTable.versionId, elementVersionId))
        );

        // if we already have a mapping the a different version of this element
        // mapped to this collection - delete it, so the latest added mapping takes precedence
        await this.databaseConnection
            .delete(elementCollectionMappingTable)
            .where(
                and(
                    eq(
                        elementCollectionMappingTable.setVersionId,
                        collectionVersionId
                    ),
                    eq(
                        elementCollectionMappingTable.elementEntityId,
                        element.entityId
                    )
                )
            );

        await this.databaseConnection
            .update(collectionTable)
            .set({
                elementCount: sql`${collectionTable.elementCount} + 1`,
            })
            .where(eq(collectionTable.versionId, collectionVersionId));

        return this.databaseConnection
            .insert(elementCollectionMappingTable)
            .values({
                setEntityId: set.entityId,
                setVersionId: collectionVersionId,
                elementEntityId: element.entityId,
                elementVersionId,
                isBaseReference,
            })
            .returning();
    }

    public async copyDependenciesBetweenCollections(data: {
        sourceVersion: CollectionVersionId;
        targetVersion: CollectionVersionId;
    }) {
        const {
            sourceVersion: sourceCollectionVersionId,
            targetVersion: targetCollectionVersionId,
        } = data;

        const targetCollection = this.strict(
            await this.getCollectionByVersionId(targetCollectionVersionId)
        );
        const dependencies = await this.getCollectionVersionDirectDependencies(
            sourceCollectionVersionId
        );

        return this.databaseConnection.transaction(async (tx) => {
            const inserts = [];
            for (const dependency of dependencies) {
                inserts.push(
                    tx.insert(collectionDependencyMappingTable).values({
                        collectionVersionId: dependency.collectionVersionId,
                        collectionEntityId: dependency.collectionEntityId,
                        dependentCollectionVersionId:
                            targetCollection.versionId,
                        dependentCollectionEntityId: targetCollection.entityId,
                    })
                );
            }
            return Promise.all(inserts);
        });
    }

    public async copyReferencesBetweenCollections(
        sourceSetVersionId: CollectionVersionId,
        targetSetVersionId: CollectionVersionId
    ) {
        await this.databaseConnection
            .insert(elementCollectionMappingTable)
            .select(
                this.databaseConnection
                    .select({
                        // INFO: This is order-sensitive, based on the order in the schema
                        // and requires ALL fields (even defaulted ones) to be selected
                        setEntityId: elementCollectionMappingTable.setEntityId,
                        setVersionId: sql<string>`${targetSetVersionId}`.as(
                            'setVersionId'
                        ),
                        elementEntityId:
                            elementCollectionMappingTable.elementEntityId,
                        elementVersionId:
                            elementCollectionMappingTable.elementVersionId,
                        isBaseReference: sql<boolean>`FALSE`.as(
                            'isBaseReference'
                        ),
                    } satisfies {
                        [key in keyof typeof elementCollectionMappingTable.$inferInsert]: any;
                    })
                    .from(elementCollectionMappingTable)
                    .where(
                        eq(
                            elementCollectionMappingTable.setVersionId,
                            sourceSetVersionId
                        )
                    )
            );
    }

    public async copyElementsBetweenCollections(data: {
        source: {
            entityId: CollectionEntityId;
            versionId: CollectionVersionId;
        };
        target: {
            entityId: CollectionEntityId;
            versionId: CollectionVersionId;
        };
    }) {
        const { source, target } = data;
        await this.databaseConnection.transaction(async (tx) => {
            const targetSet = this.onlySingleStrict(
                await tx
                    .select()
                    .from(collectionTable)
                    .where(eq(collectionTable.versionId, target.versionId))
            );

            if (!targetSet.draftState) {
                throw new Error(
                    'Can only copy exercise objects to sets in draft state'
                );
            }

            const latestElements = this.latestElements();

            const createdElements = await tx
                .with(latestElements)
                .insert(elementTable)
                .select(
                    tx
                        .select({
                            // INFO: This is order-sensitive, based on the order in the schema
                            // and requires ALL fields (even defaulted ones) to be selected
                            versionId:
                                sql`'element_version_' || uuid_generate_v4()`.as(
                                    'versionId'
                                ),
                            entityId:
                                sql`'element_entity_' || uuid_generate_v4()`.as(
                                    'entityId'
                                ),
                            version: sql<number>`1`.as('version'),
                            stateVersion: latestElements.stateVersion,
                            createdAt: sql`now()`.as('createdAt'),
                            editedAt: sql`now()`.as('editedAt'),
                            title: latestElements.title,
                            description: latestElements.description,
                            content: latestElements.content,
                        } satisfies {
                            [K in keyof typeof elementTable.$inferInsert]: any;
                        })
                        .from(latestElements)
                        .innerJoin(
                            elementCollectionMappingTable,
                            eq(
                                latestElements.versionId,
                                elementCollectionMappingTable.elementVersionId
                            )
                        )
                        .where(
                            eq(
                                elementCollectionMappingTable.setVersionId,
                                source.versionId
                            )
                        )
                )
                .returning();

            if (createdElements.length > 0) {
                await tx.insert(elementCollectionMappingTable).values(
                    createdElements.map((element) => ({
                        setEntityId: target.entityId,
                        setVersionId: target.versionId,
                        elementEntityId: element.entityId,
                        elementVersionId: element.versionId,
                        isBaseReference: false,
                    }))
                );
            }
        });
    }

    public async getElementVersionByVersionId(
        elementVersionId: ElementVersionId
    ): Promise<ElementDto | null> {
        const result = await this.databaseConnection
            .select()
            .from(elementTable)
            .where(eq(elementTable.versionId, elementVersionId));

        return this.onlySingle(result);
    }

    public async deleteElementVersion(element: VersionedElementPartial) {
        return this.transaction(async (tx) => {
            const containingCollection =
                await tx.getLatestCollectionOfElementEntity(element.entityId);

            if (containingCollection) {
                await tx.databaseConnection
                    .update(collectionTable)
                    .set({
                        elementCount: sql`${collectionTable.elementCount} - 1`,
                    })
                    .where(
                        eq(
                            collectionTable.versionId,
                            containingCollection.versionId
                        )
                    );
            }

            return tx.databaseConnection
                .delete(elementTable)
                .where(eq(elementTable.versionId, element.versionId));
        });
    }

    public async getCollectionByVersionId(versionId: CollectionVersionId) {
        const result = await this.databaseConnection
            .select()
            .from(collectionTable)
            .where(eq(collectionTable.versionId, versionId));

        return this.onlySingle(result);
    }

    public async getLatestCollectionForUser(
        userId: string,
        opts?: { allowDraftState?: boolean; archived?: boolean }
    ): Promise<ExtendedCollectionDto[]> {
        return this.transaction(async (tx) => {
            const latestCollections = tx.latestCollections({
                allowDraftState: opts?.allowDraftState ?? true,
            });

            const result = await tx.databaseConnection
                .with(latestCollections)
                .select(getTableColumns(collectionTable))
                .from(collectionUserMappingTable)
                .innerJoin(
                    latestCollections,
                    eq(
                        latestCollections.entityId,
                        collectionUserMappingTable.collection
                    )
                )
                .innerJoin(
                    collectionTable,
                    eq(collectionTable.versionId, latestCollections.versionId)
                )
                .where(
                    and(
                        eq(collectionUserMappingTable.userId, userId),
                        eq(collectionTable.archived, opts?.archived ?? false)
                    )
                );

            const extendedCollections = await Promise.all(
                result.map(async (collection) => {
                    const relationship = await tx.getUserRoleInCollection(
                        collection.entityId,
                        userId
                    );

                    return {
                        ...collection,
                        relationship: relationship!,
                    } satisfies ExtendedCollectionDto;
                })
            );

            return extendedCollections;
        });
    }

    public async getLatestPublicCollections() {
        return this.transaction(async (tx) => {
            const latestCollections = tx.latestCollections({
                allowDraftState: false,
            });

            const result = await tx.databaseConnection
                .with(latestCollections)
                .select(getTableColumns(collectionTable))
                .from(collectionTable)
                .innerJoin(
                    latestCollections,
                    eq(latestCollections.entityId, collectionTable.entityId)
                )
                .where(
                    and(
                        inArray(collectionTable.visibility, [
                            'public',
                            'embedded',
                        ]),
                        eq(collectionTable.archived, false)
                    )
                );

            return result.map(
                (collection) =>
                    ({
                        ...collection,
                        relationship: 'viewer',
                    }) satisfies ExtendedCollectionDto
            );
        });
    }

    public async getElementsOfCollectionVersion(
        setVersionId: CollectionVersionId
    ) {
        return this.databaseConnection
            .select(getTableColumns(elementTable))
            .from(elementTable)
            .leftJoin(
                elementCollectionMappingTable,
                eq(
                    elementTable.versionId,
                    elementCollectionMappingTable.elementVersionId
                )
            )
            .where(
                eq(elementCollectionMappingTable.setVersionId, setVersionId)
            );
    }

    public async getLatestElementVersion(entityId: ElementEntityId) {
        const latestElements = this.latestElements();
        const result = await this.databaseConnection
            .with(latestElements)
            .select()
            .from(latestElements)
            .where(eq(latestElements.entityId, entityId));

        return this.onlySingle(result);
    }

    public async unmapElementFromCollection(
        elementEntityId: ElementEntityId,
        collectionVersionId: CollectionVersionId
    ) {
        await this.databaseConnection.transaction(async (tx) => {
            await tx
                .delete(elementCollectionMappingTable)
                .where(
                    and(
                        eq(
                            elementCollectionMappingTable.elementEntityId,
                            elementEntityId
                        ),
                        eq(
                            elementCollectionMappingTable.setVersionId,
                            collectionVersionId
                        )
                    )
                );

            await tx
                .update(collectionTable)
                .set({
                    elementCount: sql`${collectionTable.elementCount} - 1`,
                })
                .where(eq(collectionTable.versionId, collectionVersionId));
        });
    }

    public async deleteCollection(entityId: CollectionEntityId) {
        await this.databaseConnection
            .delete(collectionTable)
            .where(eq(collectionTable.entityId, entityId));
    }

    public async getElementVersions(entityId: ElementEntityId) {
        const result = await this.databaseConnection
            .select()
            .from(elementTable)
            .where(eq(elementTable.entityId, entityId))
            .orderBy(desc(elementTable.version));

        return result;
    }

    public async setCollectionVisibility(
        setEntityId: CollectionEntityId,
        visibility: CollectionVisibility
    ) {
        return this.onlySingleStrict(
            await this.databaseConnection
                .update(collectionTable)
                .set({
                    visibility,
                })
                .where(eq(collectionTable.entityId, setEntityId))
                .returning()
        );
    }

    public async getLatestCollectionByEntityId(
        setEntityId: CollectionEntityId,
        opts?: { allowDraftState?: boolean }
    ) {
        const latestCollections = this.latestCollections({
            allowDraftState: opts?.allowDraftState ?? true,
        });

        return this.onlySingle(
            await this.databaseConnection
                .with(latestCollections)
                .select()
                .from(latestCollections)
                .where(eq(latestCollections.entityId, setEntityId))
        );
    }

    public async getLatestCollectionOfElementEntity(
        elementEntityId: ElementEntityId
    ) {
        return this.onlySingle(
            await this.databaseConnection
                .select(getTableColumns(collectionTable))
                .from(collectionTable)
                .innerJoin(
                    elementCollectionMappingTable,
                    eq(
                        collectionTable.versionId,
                        elementCollectionMappingTable.setVersionId
                    )
                )
                .where(
                    eq(
                        elementCollectionMappingTable.elementEntityId,
                        elementEntityId
                    )
                )
                .orderBy(desc(collectionTable.version))
                .limit(1)
        );
    }

    public async archiveCollection(
        collectionEntityId: CollectionEntityId,
        unarchive = false
    ) {
        return this.databaseConnection
            .update(collectionTable)
            .set({
                archived: !unarchive,
            })
            .where(eq(collectionTable.entityId, collectionEntityId))
            .returning();
    }

    /**
     * This is marked as unsafe as to prevent its use in production code (apart from upgrading scripts)
     * as it it retrieves all elements regardless of their versions, collection mappings, etc.,
     * and thus can lead to unintended results if used incorrectly.
     */
    public async UNSAFE_getAllElements() {
        return this.databaseConnection.select().from(elementTable);
    }

    /**
     * This should only be used in upgrading scripts!
     *
     * It WILL break the integrity of collections and
     * exercises if used incorrectly
     */
    public async UNSAFE_overwriteElements(
        stateVersion: number,
        elementContents: VersionedElementContent[]
    ): Promise<number> {
        return this.databaseConnection.transaction(async (tx) => {
            // from https://orm.drizzle.team/docs/guides/update-many-with-different-value
            if (elementContents.length === 0) {
                return 0;
            }

            const sqlChunks: SQL[] = [];
            const ids: ElementVersionId[] = [];

            sqlChunks.push(sql`(case`);

            for (const content of elementContents) {
                if (content.entity?.versionId === undefined) {
                    console.error(
                        'versionId is required for UNSAFE_overwriteElements',
                        content
                    );
                    continue;
                }
                sqlChunks.push(
                    sql`when ${elementTable.versionId} = ${content.entity.versionId} then ${JSON.stringify(content)}::jsonb`
                );
                ids.push(content.entity.versionId);
            }

            sqlChunks.push(sql`end)`);

            const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

            const result = await tx
                .update(elementTable)
                .set({ content: finalSql, stateVersion })
                .where(inArray(elementTable.versionId, ids))
                .returning();
            return result.length;
        });
    }
}
