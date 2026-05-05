import type {
    CollectionDto,
    CollectionElementsDto,
    CollectionElementsSingle,
    CollectionEntityId,
    CollectionRelationshipType,
    CollectionVersionId,
    ElementDto,
    ElementEntityId,
    ElementVersionId,
    ExtendedCollectionDto,
    Marketplace,
    ParticipantKey,
    VehicleTemplate,
    VersionedElementContent,
    VersionedElementPartial,
} from 'fuesim-digital-shared';
import {
    applyMigrations,
    cloneDeepMutable,
    ExerciseState,
    gatherCollectionElements,
    getCollectionElementDiff,
    getDependencyChecker,
    getElementDependencies,
    isVersionedElementContent,
    replaceDependencies,
} from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import type { WritableDraft } from 'immer';
import type { CollectionRepository } from '../repositories/collection-repository.js';

interface EventBuffer {
    next: (event: typeof Marketplace.Collection.Events.SSEvent.Type) => void;
    flush: () => void;
}

export class CollectionService {
    public async transaction<T>(
        operation: (tx: CollectionService) => Promise<T>
    ): Promise<T> {
        return this.collectionRepository.transaction(async (tx) => {
            const serviceCopy = new CollectionService(tx, this.eventSubject);
            return operation(serviceCopy);
        });
    }

    private async reduce<T>(
        collectionEntityId: CollectionEntityId,
        operation: (
            tx: CollectionService,
            draftState: CollectionDto,
            eventBuffer: EventBuffer
        ) => Promise<T>
    ): Promise<T> {
        return this.transaction(async (tx) => {
            const eventBuffer = tx.newDeferredEventBuffer();

            const [draftState, createdNewDraftState] =
                await tx.collectionRepository.getOrCreateDraftState(
                    collectionEntityId
                );
            if (createdNewDraftState) {
                eventBuffer.next({
                    event: 'collection:update',
                    data: draftState,
                    collectionEntityId,
                });
            }

            const result = await operation(tx, draftState, eventBuffer);

            eventBuffer.flush();

            return result;
        });
    }

    public get events() {
        return this.eventSubject.asObservable();
    }

    private readonly newDeferredEventBuffer = (): EventBuffer => {
        // I opted against a ReplaySubject here to not worry about completing correctly if a functions throws
        // and doesnt complete this subject
        const subject: (typeof Marketplace.Collection.Events.SSEvent.Type)[] =
            [];

        return {
            next: (
                event: typeof Marketplace.Collection.Events.SSEvent.Type
            ) => {
                subject.push(event);
            },
            flush: () => {
                const eventsToFlush = [...subject];
                subject.length = 0;
                for (const event of eventsToFlush) {
                    this.eventSubject.next(event);
                }
            },
        };
    };

    private exists<T>(element: T | null | undefined): NonNullable<T> {
        if (!element) {
            throw new Error(`No element found, where one was expected.`);
        }
        return element;
    }

    public constructor(
        private readonly collectionRepository: CollectionRepository,
        private readonly eventSubject = new Subject<
            typeof Marketplace.Collection.Events.SSEvent.Type
        >()
    ) {}

    public async initialize() {
        await this.collectionRepository.setDefaultCollectionData();
    }

    public async getCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        return this.collectionRepository.getJoinCode(collectionEntityId);
    }

    public async getOrCreateCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        return this.collectionRepository.getOrCreateJoinCode(
            collectionEntityId
        );
    }

    public async revokeCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        return this.collectionRepository.revokeJoinCode(collectionEntityId);
    }

    public async getUserRoleInCollection(
        collectionEntityId: CollectionEntityId,
        userId: string
    ): Promise<CollectionRelationshipType | null> {
        return this.collectionRepository.getUserRoleInCollection(
            collectionEntityId,
            userId
        );
    }

    /**
     * This function (unlike getUserRoleInCollection) also
     * checks parent collections.
     *
     * So that a user can access a collection which is imported
     * into another collection where the user has permissions.
     */
    public async getUserRoleInCollectionTransitive(
        collectionEntityId: CollectionEntityId,
        userId: string
    ): Promise<CollectionRelationshipType | null> {
        const directRole = await this.getUserRoleInCollection(
            collectionEntityId,
            userId
        );
        if (directRole !== null) return directRole;

        const parentCollections =
            await this.collectionRepository.getParentCollectionsOfCollectionVersion(
                collectionEntityId,
                // we only need one level of parent collections.
                // since we want to access dependency collections if we are part of a collection which imports them,
                // but there is no need to check further up the chain, since there is no UI for that.
                false
            );

        const rolesInParents = await Promise.all(
            parentCollections.map(async (parentCollection) => {
                const parentRole = await this.getUserRoleInCollection(
                    parentCollection,
                    userId
                );

                return parentRole !== null;
            })
        );

        // if we dont have direct rights, the highest role we can get is other
        return rolesInParents.some((r) => r) ? 'other' : null;
    }

    public async getCollectionMembers(collectionEntityId: CollectionEntityId) {
        return this.collectionRepository.getCollectionMembers(
            collectionEntityId
        );
    }

    public async setCollectionMemberRole(
        collectionEntityId: CollectionEntityId,
        userId: string,
        role: CollectionRelationshipType
    ) {
        return this.collectionRepository.setUserCollectionRelationship(
            userId,
            collectionEntityId,
            role
        );
    }

    public async removeCollectionMember(
        collectionEntityId: CollectionEntityId,
        userId: string
    ) {
        return this.collectionRepository.removeCollectionMember(
            collectionEntityId,
            userId
        );
    }

    public async createCollection(name: string, owner: string) {
        return this.collectionRepository.transaction(async (tx) => {
            const createdCollection =
                await tx.createFirstCollectionVersion(name);
            await tx.setUserCollectionRelationship(
                owner,
                createdCollection.entityId,
                'admin'
            );
            return createdCollection;
        });
    }

    public async getCollectionByJoinCode(joinCode: string) {
        return this.collectionRepository.transaction(async (tx) => {
            const collectionId = this.exists(
                await tx.getCollectionByJoinCode(joinCode)
            );
            const collection = this.exists(
                await tx.getLatestCollectionByEntityId(collectionId)
            );
            return collection;
        });
    }

    public async joinCollectionByCode(joinCode: string, userId: string) {
        return this.collectionRepository.transaction(async (tx) => {
            const collectionEntityId = this.exists(
                await tx.getCollectionByJoinCode(joinCode)
            );

            await tx.setUserCollectionRelationship(
                userId,
                collectionEntityId,
                'viewer',
                { allowDowngrade: false }
            );

            return collectionEntityId;
        });
    }

    public async updateCollectionMetadata(
        collectionEntityId: CollectionEntityId,
        data: Marketplace.Collection.EditableCollectionProperties
    ) {
        return this.reduce(
            collectionEntityId,
            async (tx, draftState, eventBuffer) => {
                const updatedCollection =
                    await tx.collectionRepository.updateCollectionData(
                        draftState.versionId,
                        data
                    );

                if (updatedCollection === null) {
                    throw new Error('Failed to update collection metadata');
                }

                eventBuffer.next({
                    event: 'collection:update',
                    data: updatedCollection,
                    collectionEntityId,
                });

                return updatedCollection;
            }
        );
    }

    public async saveDraftState(collectionEntityId: CollectionEntityId) {
        return this.reduce(
            collectionEntityId,
            async (tx, draftState, eventBuffer) => {
                const data =
                    await tx.collectionRepository.saveDraftState(
                        collectionEntityId
                    );

                const elements = await tx.getElementsOfCollectionVersion(
                    data.versionId,
                    { allowDraftState: false }
                );

                eventBuffer.next({
                    event: 'collection:update',
                    data,
                    collectionEntityId,
                });

                eventBuffer.next({
                    event: 'collection:refresh-data',
                    data: {
                        draftElements: elements,
                        publishedElements: elements,
                        publishedCollection: data,
                    },
                    collectionEntityId,
                });

                return data;
            }
        );
    }

    public async revertDraftState(collectionEntityId: CollectionEntityId) {
        return this.reduce(
            collectionEntityId,
            async (tx, draftState, eventBuffer) => {
                await this.collectionRepository.revertDraftState(
                    collectionEntityId
                );

                const latestCollectionVersion = tx.exists(
                    await tx.collectionRepository.getLatestCollectionByEntityId(
                        collectionEntityId,
                        { allowDraftState: true }
                    )
                );

                const elements = await tx.getElementsOfCollectionVersion(
                    latestCollectionVersion.versionId,
                    { allowDraftState: false }
                );

                eventBuffer.next({
                    event: 'collection:update',
                    data: latestCollectionVersion,
                    collectionEntityId,
                });

                eventBuffer.next({
                    event: 'collection:refresh-data',
                    data: {
                        draftElements: elements,
                        publishedElements: elements,
                    },
                    collectionEntityId,
                });

                return latestCollectionVersion;
            }
        );
    }

    public async addCollectionDependency(data: {
        importTo: CollectionEntityId;
        importFrom: CollectionVersionId;
    }) {
        return this.reduce(
            data.importTo,
            async (tx, draftState, eventBuffer) => {
                const importFromCollection = tx.exists(
                    await tx.collectionRepository.getCollectionByVersionId(
                        data.importFrom
                    )
                );

                // TODO: Check if dependency can be added!

                if (importFromCollection.draftState) {
                    throw new Error(
                        `Collection version with id ${data.importFrom} is in draft state and can not be imported`
                    );
                }

                const existingDependencies = await tx.getCollectionDependencies(
                    draftState.versionId
                );
                const existingCollectionDependency = existingDependencies.find(
                    (dep) => dep.entityId === importFromCollection.entityId
                );
                if (existingCollectionDependency !== undefined) {
                    throw new Error(
                        'This collection already depends on a version of the imported collection. Please remove the existing dependency before adding a new one.'
                    );
                }

                await tx.collectionRepository.addCollectionVersionDependency(
                    draftState.versionId,
                    importFromCollection.versionId
                );

                eventBuffer.next({
                    event: 'dependency:change',
                    data: importFromCollection.versionId,
                    collectionEntityId: data.importTo,
                });

                const newlyImportedElements = tx.exists(
                    await tx.collectionRepository.getElementsOfCollectionVersion(
                        importFromCollection.versionId
                    )
                );

                return {
                    collection: importFromCollection,
                    elements: newlyImportedElements,
                    newCollectionVersion: draftState,
                };
            }
        );
    }

    public async upgradeCollectionDependency(data: {
        upgradeIn: CollectionEntityId;
        upgradeTo: CollectionVersionId;
        acceptedElementChanges: ElementVersionId[];
    }) {
        return this.reduce(
            data.upgradeIn,
            async (tx, draftState, eventBuffer) => {
                const upgradeToCollection = tx.exists(
                    await tx.collectionRepository.getCollectionByVersionId(
                        data.upgradeTo
                    )
                );

                // Only allow upgrading if we already depend on the collection
                const existingDependencies = await tx.getCollectionDependencies(
                    draftState.versionId
                );
                const existingCollectionDependency = existingDependencies.find(
                    (dep) => dep.entityId === upgradeToCollection.entityId
                );
                if (!existingCollectionDependency) {
                    throw new Error(
                        'Cannot upgrade collection dependency, because the collection does not have an existing dependency on the provided collection entity.'
                    );
                }

                const oldCollectionVersionElements =
                    await tx.getElementsOfCollectionVersion(
                        existingCollectionDependency.versionId,
                        { allowDraftState: false }
                    );
                const newCollectionVersionElements =
                    await tx.getElementsOfCollectionVersion(
                        upgradeToCollection.versionId,
                        {
                            allowDraftState: false,
                        }
                    );

                const changesBetweenVersions = getCollectionElementDiff(
                    gatherCollectionElements(
                        oldCollectionVersionElements
                    ).allDirectElements(),
                    gatherCollectionElements(
                        newCollectionVersionElements
                    ).allDirectElements()
                );

                // Fetch, which elements of our Collection depend on the collection we want to upgrade
                const dependingElements =
                    await tx.getDependingElementsForCollection({
                        depender: draftState.versionId,
                        dependency: existingCollectionDependency.versionId,
                    });

                const changedDependingElements = dependingElements.filter(
                    (de) =>
                        changesBetweenVersions.some(
                            (change) => change.old?.versionId === de.versionId
                        )
                );

                console.log(
                    JSON.stringify(
                        {
                            changesBetweenVersions,
                            dependingElements,
                            changedDependingElements,
                        },
                        null,
                        2
                    )
                );

                // Check if the provided acceptedElementDeletions actually account for all depending elements
                if (
                    !changedDependingElements.every((ed) =>
                        data.acceptedElementChanges.includes(ed.versionId)
                    )
                ) {
                    throw new Error(
                        'Not all depending elements are accounted for in the accepted element deletions.'
                    );
                }

                await Promise.all(
                    dependingElements.map(async (dependingElement) => {
                        const dependencies =
                            await tx.getDependenciesOfElement(dependingElement);
                        const dependencyCheck = getDependencyChecker(
                            dependingElement.content.type
                        );
                        if (!dependencyCheck) {
                            if (dependencies.length > 0) {
                                throw new Error(
                                    `Element with type ${dependingElement.content.type} has dependencies but no dependency checker is implemented for this type.`
                                );
                            }
                            return;
                        }

                        const newContent = replaceDependencies(
                            dependingElement.content,
                            dependencies.map((d) => ({
                                old: d.versionId,
                                new:
                                    newCollectionVersionElements.direct.find(
                                        (f) => f.entityId === d.entityId
                                    )?.versionId ?? null,
                            }))
                        );

                        await tx.updateElement(
                            dependingElement.entityId,
                            cloneDeepMutable(newContent)
                        );
                    })
                );

                await tx.collectionRepository.removeCollectionVersionDependency(
                    draftState.versionId,
                    existingCollectionDependency.versionId
                );

                await tx.collectionRepository.addCollectionVersionDependency(
                    draftState.versionId,
                    data.upgradeTo
                );

                eventBuffer.next({
                    collectionEntityId: data.upgradeIn,
                    event: 'dependency:change',
                    data: upgradeToCollection.versionId,
                });

                return {
                    collection: upgradeToCollection,
                    elements: [], // TODO: ,
                    newCollectionVersion: draftState,
                };
            }
        );
    }

    public async removeCollectionDependency(data: {
        removeFrom: CollectionEntityId;
        dependencyEntityId: CollectionVersionId;
    }): Promise<{
        newCollection: CollectionDto | null;
        blockingElements: ElementDto[];
    }> {
        return this.reduce(
            data.removeFrom,
            async (tx, draftState, eventBuffer) => {
                const dependingElements =
                    await tx.getDependingElementsForCollection({
                        depender: draftState.versionId,
                        dependency: data.dependencyEntityId,
                    });

                if (dependingElements.length > 0) {
                    console.warn(
                        `Trying to remove dependency ${data.dependencyEntityId} from collection ${data.removeFrom}, but there are still elements depending on this dependency. Depending elements: ${dependingElements.map((de) => de.entityId).join(', ')}`
                    );
                    return {
                        blockingElements: dependingElements,
                        newCollection: null,
                    };
                }

                await tx.collectionRepository.removeCollectionVersionDependency(
                    draftState.versionId,
                    data.dependencyEntityId
                );

                eventBuffer.next({
                    collectionEntityId: data.removeFrom,
                    event: 'dependency:change',
                    data: data.dependencyEntityId,
                });

                return {
                    newCollection: draftState,
                    blockingElements: [],
                };
            }
        );
    }

    public async createExerciseObjects(
        collectionEntityId: CollectionEntityId,
        contents: VersionedElementContent[]
    ) {
        return this.reduce(
            collectionEntityId,
            async (tx, draftState, eventBuffer) => {
                const results: ElementDto[] = [];

                await Promise.all(
                    contents.map(async (content) => {
                        const result = this.exists(
                            await tx.collectionRepository.createElementVersion({
                                version: 1,
                                content,
                            })
                        );

                        await tx.collectionRepository.addElementToCollection(
                            result.versionId,
                            draftState.versionId
                        );

                        eventBuffer.next({
                            event: 'element:create',
                            data: result,
                            collectionEntityId,
                        });
                        results.push(result);
                    })
                );

                return {
                    newSetVersionId: draftState.versionId,
                    results,
                };
            }
        );
    }

    public async getLatestCollectionsForUser(
        userId: string,
        opts: { includeDraftState: boolean; archived?: boolean }
    ): Promise<ExtendedCollectionDto[]> {
        return this.collectionRepository.getLatestCollectionForUser(userId, {
            allowDraftState: opts.includeDraftState,
            archived: opts.archived,
        });
    }

    public async getLatestPublicCollections(): Promise<
        ExtendedCollectionDto[]
    > {
        return this.collectionRepository.getLatestPublicCollections();
    }

    public async getLatestUsableCollections(
        userId: string
    ): Promise<ExtendedCollectionDto[]> {
        const userCollections =
            await this.collectionRepository.getLatestCollectionForUser(userId, {
                allowDraftState: false,
                archived: false,
            });
        const publicCollections =
            await this.collectionRepository.getLatestPublicCollections();

        return [
            ...userCollections,
            ...publicCollections.filter(
                (publicCollection) =>
                    !userCollections.some(
                        (userCollection) =>
                            userCollection.entityId ===
                            publicCollection.entityId
                    )
            ),
        ];
    }

    public async getLatestCollectionById(
        collectionEntityId: CollectionEntityId,
        opts: { draftState: boolean }
    ): Promise<CollectionDto | null> {
        return this.collectionRepository.getLatestCollectionByEntityId(
            collectionEntityId,
            { allowDraftState: opts.draftState }
        );
    }

    public async getCollectionVersionById(
        collectionVersionId: CollectionVersionId
    ) {
        return this.collectionRepository.getCollectionByVersionId(
            collectionVersionId
        );
    }

    public async getCollectionDependencies(
        collectionVersionId: CollectionVersionId
    ) {
        return (
            await this.collectionRepository.getCollectionVersionDirectDependencies(
                collectionVersionId
            )
        ).map((dependency) => ({
            entityId: dependency.collectionEntityId,
            versionId: dependency.collectionVersionId,
        }));
    }

    public async getLatestDraftElementsOfCollection(
        entity: CollectionEntityId
    ): Promise<CollectionElementsDto> {
        const latestConnection = this.exists(
            await this.collectionRepository.getLatestCollectionByEntityId(
                entity,
                { allowDraftState: true }
            )
        );

        const elements = await this.getElementsOfCollectionVersion(
            latestConnection.versionId,
            {
                allowDraftState: true,
            }
        );

        return elements;
    }

    /**
     * Finds all direct AND TRANSITIVE elements being used inside a collection.
     *
     * useful for resolving dependencies of lower-level collections in collections or exercises in collections,
     * where we do not want to show the user all dependencies, but still need to know about them.
     */
    private async getUsedElementsDeep(
        elements: ElementDto[]
    ): Promise<CollectionElementsSingle[]> {
        const foundElements: CollectionElementsSingle[] = [];
        await Promise.all(
            elements.map(async (element) => {
                const elementVersions = getElementDependencies(element.content);

                const foundSubElements: ElementDto[] = (
                    await Promise.all(
                        elementVersions.map(async (m) =>
                            this.collectionRepository.getElementVersionByVersionId(
                                m
                            )
                        )
                    )
                ).filter((f) => f !== null);

                const elementCollections: CollectionElementsSingle[] =
                    await Promise.all(
                        foundSubElements.map(async (m) => ({
                            elements: [m],
                            collection: this.exists(
                                await this.collectionRepository.getLatestCollectionOfElementEntity(
                                    m.entityId
                                )
                            ),
                        }))
                    );

                foundElements.push(
                    ...elementCollections,
                    ...(await this.getUsedElementsDeep(foundSubElements))
                );
            })
        );

        const result: CollectionElementsSingle[] = [];

        for (const foundElement of foundElements) {
            const sameCollectionVersion = foundElements.filter(
                (f) => f.collection.versionId
            );
            result.push({
                collection: foundElement.collection,
                elements: [
                    ...foundElement.elements,
                    ...sameCollectionVersion.flatMap((m) => m.elements),
                ],
            });
        }

        return result;
    }

    public async getDirectDependencyElements(
        collectionVersionId: CollectionVersionId
    ): Promise<CollectionElementsSingle[]> {
        const dependencies =
            await this.collectionRepository.getCollectionVersionDirectDependencies(
                collectionVersionId
            );

        const elements: CollectionElementsSingle[] = [];

        await Promise.all(
            dependencies.map(async (dependency) => {
                const collection = this.exists(
                    await this.collectionRepository.getCollectionByVersionId(
                        dependency.collectionVersionId
                    )
                );
                const elementsOfDependency =
                    await this.collectionRepository.getElementsOfCollectionVersion(
                        dependency.collectionVersionId
                    );
                elements.push({
                    collection,
                    elements: elementsOfDependency,
                });
            })
        );

        return elements;
    }

    public async getElementsOfCollectionVersion(
        collectionVersionId: CollectionVersionId,
        opts: {
            allowDraftState: boolean;
        }
    ): Promise<CollectionElementsDto> {
        const baseCollection = this.exists(
            await this.collectionRepository.getCollectionByVersionId(
                collectionVersionId
            )
        );

        if (baseCollection.draftState && !opts.allowDraftState) {
            throw new Error(
                'Collection version is in draft state and allowDraftState is set to false'
            );
        }

        const directCollectionElements =
            await this.collectionRepository.getElementsOfCollectionVersion(
                collectionVersionId
            );

        const directDependencyElements =
            await this.getDirectDependencyElements(collectionVersionId);

        const furtherElementReferences = await this.getUsedElementsDeep(
            directDependencyElements.flatMap((m) => m.elements)
        );

        return {
            direct: directCollectionElements,
            imported: directDependencyElements,
            references: furtherElementReferences,
        };
    }

    public async archiveCollection(
        collectionEntityId: CollectionEntityId,
        unarchive = false
    ) {
        const result = await this.collectionRepository.archiveCollection(
            collectionEntityId,
            unarchive
        );
        const latestCollectionVersion = result.reduce((latest, current) => {
            if (!latest) {
                return current;
            }
            if (current.version > latest.version) {
                return current;
            }
            return latest;
        }, result[0]);

        if (!latestCollectionVersion) {
            throw new Error('Failed to archive/unarchive collection');
        }

        this.eventSubject.next({
            event: 'collection:update',
            data: latestCollectionVersion,
            collectionEntityId,
        });

        return result;
    }

    public async getExerciseElementObjectVersions(entityId: ElementEntityId) {
        return this.collectionRepository.getElementVersions(entityId);
    }

    private async isElementInLatestCollectionVersion(
        elementEntityId: ElementEntityId
    ): Promise<[boolean, CollectionDto]> {
        const latestContainingCollection = this.exists(
            await this.collectionRepository.getLatestCollectionOfElementEntity(
                elementEntityId
            )
        );
        const latestVersionOfContainingCollection = this.exists(
            await this.collectionRepository.getLatestCollectionByEntityId(
                latestContainingCollection.entityId,
                { allowDraftState: true }
            )
        );

        if (
            latestVersionOfContainingCollection.versionId !==
            latestContainingCollection.versionId
        ) {
            return [false, latestVersionOfContainingCollection];
        }

        return [true, latestVersionOfContainingCollection];
    }

    public async updateElement(
        entityId: ElementEntityId,
        content: VersionedElementContent,
        resolutionStrategy?: Marketplace.Element.EditConflictResolution
    ) {
        return this.transaction(async (tx) => {
            const eventBuffer = tx.newDeferredEventBuffer();

            // We can only update an element if its present in the lastest collection version
            const [
                elementIsInLatestCollectionVersion,
                latestContainingCollection,
            ] = await tx.isElementInLatestCollectionVersion(entityId);

            if (!elementIsInLatestCollectionVersion) {
                throw new Error(
                    `Element with id ${entityId} does not exist in the latest version of the containing collection and can therefore not be updated.`
                );
            }

            // create a new draft state to apply the changes to
            const [draftState, createdNewDraftState] =
                await tx.collectionRepository.getOrCreateDraftState(
                    latestContainingCollection.entityId
                );
            if (createdNewDraftState) {
                eventBuffer.next({
                    event: 'collection:update',
                    data: draftState,
                    collectionEntityId: latestContainingCollection.entityId,
                });
            }

            const latestElementVersion = this.exists(
                await tx.collectionRepository.getLatestElementVersion(entityId)
            );

            let newElementVersion: ElementDto;

            // Check if we have other elements in this collection, which
            // depend on the element we want to update.
            // If we do, check if we have accounted for them in the resolutionStrategy
            const dependingElements = await tx.getDependingElements(
                latestElementVersion,
                draftState.versionId
            );
            if (dependingElements.length > 0) {
                if (!resolutionStrategy) {
                    throw new Error(
                        'depending elements exist, but no resolution strategy provided'
                    );
                } else if (
                    !dependingElements.every((de) =>
                        resolutionStrategy.affectingElementIds.includes(
                            de.versionId
                        )
                    )
                ) {
                    throw new Error(
                        'the provided resolution strategy does not account for all depending elements.'
                    );
                }
            }

            const elementMapping =
                await tx.collectionRepository.getElementCollectionMapping(
                    latestElementVersion.versionId,
                    draftState.versionId
                );

            if (resolutionStrategy?.strategy === 'createCopy') {
                const duplicatedElement = await tx.createExerciseObjects(
                    latestContainingCollection.entityId,
                    [content]
                );
                newElementVersion = tx.exists(duplicatedElement.results[0]);
            } else if (elementMapping.isBaseReference === true) {
                // just overwrite the already mapped element
                // if it is the base reference in the current draftstate
                // and therefore not referenced by any other collection version
                newElementVersion = tx.exists(
                    await this.collectionRepository.updateElementContent(
                        latestElementVersion.versionId,
                        content
                    )
                );
            } else {
                // we only have a secondary reference
                // we need to create a new copy of the element
                // and switch the reference from the old element to the new one in the collection mapping

                newElementVersion = tx.exists(
                    await tx.collectionRepository.createElementVersion({
                        content,
                        version: latestElementVersion.version + 1,
                        entityId,
                    })
                );

                // This function automatically unmaps the old reference
                // we dont need to care about removing the old element from the collection,
                // because it is not mapped as base reference and therefore
                // belongs to a different collection version
                await tx.collectionRepository.addElementToCollection(
                    newElementVersion.versionId,
                    draftState.versionId
                );
            }

            // If cascade was chosen as a resolution strategy, we need to update all depending elements
            if (resolutionStrategy?.strategy === 'cascadeChanges') {
                await Promise.all(
                    dependingElements.map(async (dependingElement) => {
                        const newContent = JSON.parse(
                            JSON.stringify(dependingElement.content).replaceAll(
                                latestElementVersion.versionId,
                                newElementVersion.versionId
                            )
                        );
                        await tx.updateElement(
                            dependingElement.entityId,
                            newContent,
                            resolutionStrategy
                        );
                    })
                );
            }

            eventBuffer.next({
                event: 'element:update',
                data: newElementVersion,
                collectionEntityId: draftState.entityId,
            });

            eventBuffer.flush();

            return {
                newSetVersionId: draftState.versionId,
                newElement: newElementVersion,
            };
        });
    }

    /**
     * Finds all directly AND TRANSITIVELY referenced element versions in the content of an element
     */
    private async getDependenciesOfElement(
        element: ElementDto,
        opts: { transitive?: boolean } = { transitive: true }
    ): Promise<ElementDto[]> {
        const directElementReferences = (
            await Promise.all(
                getElementDependencies(element.content).map(
                    async (elementVersionId) =>
                        this.collectionRepository.getElementVersionByVersionId(
                            elementVersionId
                        )
                )
            )
        ).filter((elem) => elem !== null);

        const transitiveElementReferences = (
            opts.transitive === true
                ? await Promise.all(
                      directElementReferences.map(async (directReference) =>
                          this.getDependenciesOfElement(directReference)
                      )
                  )
                : []
        ).flat();

        return [...directElementReferences, ...transitiveElementReferences];
    }

    public async deleteElementFromCollection(
        elementEntityId: ElementEntityId,
        acceptedCascadingDeletions: ElementVersionId[] = []
    ): Promise<typeof Marketplace.Element.Delete.Response> {
        return this.transaction(async (tx) => {
            const eventBuffer = tx.newDeferredEventBuffer();

            const containingSet = tx.exists(
                await tx.collectionRepository.getLatestCollectionOfElementEntity(
                    elementEntityId
                )
            );

            const [elementIsInLatestCollectionVersion] =
                await this.isElementInLatestCollectionVersion(elementEntityId);

            if (!elementIsInLatestCollectionVersion) {
                throw new Error(
                    `Element with id ${elementEntityId} does not exist in the latest version of the containing collection and can therefore not be deleted.`
                );
            }

            const [draftState, createdNewDraftState] =
                await tx.collectionRepository.getOrCreateDraftState(
                    containingSet.entityId
                );
            if (createdNewDraftState) {
                eventBuffer.next({
                    event: 'collection:update',
                    data: draftState,
                    collectionEntityId: containingSet.entityId,
                });
            }

            const latestElementVersion = tx.exists(
                await tx.collectionRepository.getLatestElementVersion(
                    elementEntityId
                )
            );

            const dependingElements = await tx.getDependingElements(
                latestElementVersion,
                draftState.versionId
            );
            if (
                dependingElements.some(
                    (de) => !acceptedCascadingDeletions.includes(de.versionId)
                )
            ) {
                return {
                    newSetVersionId: null,
                    requiresConfirmation: dependingElements,
                };
            }

            const elementMapping =
                await tx.collectionRepository.getElementCollectionMapping(
                    latestElementVersion.versionId,
                    draftState.versionId
                );

            if (elementMapping.isBaseReference === true) {
                // just delete the element, when it's the only reference in the current draftstate
                // (no other collection version references this element version)
                await tx.collectionRepository.deleteElementVersion(
                    latestElementVersion
                );
            } else {
                // unmap the reference to the element since it is not the base reference
                // and therefore belongs to a different collection version
                await tx.collectionRepository.unmapElementFromCollection(
                    elementEntityId,
                    draftState.versionId
                );
            }

            if (dependingElements.length > 0) {
                await tx.removeReferenceFromElements(
                    // We are able to use the latest version here,
                    // bc we are only working inside the same collection
                    // and all elements should always be using the same,
                    // latest version of the referenced element
                    latestElementVersion.versionId,
                    dependingElements.map((de) => de.versionId)
                );
            }

            eventBuffer.next({
                event: 'element:delete',
                data: {
                    entityId: elementEntityId,
                },
                collectionEntityId: containingSet.entityId,
            });

            eventBuffer.flush();

            return {
                newSetVersionId: draftState.versionId,
                requiresConfirmation: [],
            };
        });
    }

    public async restoreDeletedElementVersion(
        collectionEntityId: CollectionEntityId,
        elementVersionId: ElementVersionId
    ) {
        return this.reduce(
            collectionEntityId,
            async (tx, draftState, eventBuffer) => {
                await tx.collectionRepository.addElementToCollection(
                    elementVersionId,
                    draftState.versionId,
                    false
                );
                const element = tx.exists(
                    await tx.collectionRepository.getElementVersionByVersionId(
                        elementVersionId
                    )
                );
                eventBuffer.next({
                    event: 'element:create',
                    data: element,
                    collectionEntityId,
                });
                return {
                    newCollectionVersion: draftState,
                    restoredElement: element,
                };
            }
        );
    }

    /**
     * INFO: Should only be used for deleting references inside the same collection
     */
    private async removeReferenceFromElements(
        removeElementVersionId: ElementVersionId,
        containingElements: ElementVersionId[]
    ) {
        return this.transaction(async (tx) => {
            await Promise.all(
                containingElements.map(async (containingElement) => {
                    const containingElementData = this.exists(
                        await tx.collectionRepository.getElementVersionByVersionId(
                            containingElement
                        )
                    );
                    const newContent = replaceDependencies(
                        containingElementData.content,
                        [{ old: removeElementVersionId, new: null }]
                    );
                    await tx.updateElement(
                        containingElementData.entityId,
                        cloneDeepMutable(newContent)
                    );
                })
            );
        });
    }

    /**
     * Fetches all elements inside a collection which depend on the given element
     *
     * CAN INCLUDES TRANSITIVE (OPTION)
     */
    public async getDependingElements(
        element: VersionedElementPartial,
        collectionVersionId: CollectionVersionId,
        opts: { includeTransitive?: boolean } = { includeTransitive: true }
    ) {
        const elementsInCollection =
            await this.collectionRepository.getElementsOfCollectionVersion(
                collectionVersionId
            );

        // TODO: @Quixelation - check if circular dependencies can cause performance issues here
        const dependingElements = (
            await Promise.all(
                elementsInCollection.map(async (collectionElement) => ({
                    element: collectionElement,
                    dependsOn: await this.getDependenciesOfElement(
                        collectionElement,
                        {
                            transitive: opts.includeTransitive,
                        }
                    ),
                }))
            )
        )
            .filter((f) =>
                f.dependsOn.some(
                    (dependency) => dependency.entityId === element.entityId
                )
            )
            .map((m) => m.element);

        return dependingElements;
    }

    /**
     * Fetches all elements inside a collection which depend on any of the elements of a given collection
     *
     * This is useful for finding elements which depend on an imported collection.
     *
     * does NOT include transitive dependencies - only the main depending element
     */
    public async getDependingElementsForCollection(data: {
        depender: CollectionVersionId;
        dependency: CollectionVersionId;
    }) {
        const elementsInDependency = await this.getElementsOfCollectionVersion(
            data.dependency,
            {
                // dependencies should never be draft states
                allowDraftState: false,
            }
        );

        const dependingElements: ElementDto[] = [];
        await Promise.all(
            elementsInDependency.direct.map(async (dependencyElement) => {
                const dependencies = await this.getDependingElements(
                    dependencyElement,
                    data.depender,
                    { includeTransitive: false }
                );
                dependingElements.push(...dependencies);
            })
        );

        return dependingElements.reduce<ElementDto[]>(
            (uniqueDependingElements, current) => {
                if (
                    !uniqueDependingElements.some(
                        (elem) => elem.versionId === current.versionId
                    )
                ) {
                    uniqueDependingElements.push(current);
                }
                return uniqueDependingElements;
            },
            []
        );
    }

    public async makeCollectionPublic(collectionEntityId: CollectionEntityId) {
        const data = await this.collectionRepository.setCollectionVisibility(
            collectionEntityId,
            'public'
        );

        this.eventSubject.next({
            event: 'collection:update',
            data,
            collectionEntityId,
        });

        return data;
    }

    public async duplicateElementVersion(
        elementVersionId: ElementVersionId,
        targetCollectionEntity: CollectionEntityId
    ) {
        return this.reduce(
            targetCollectionEntity,
            async (tx, draftState, eventBuffer) => {
                const sourceElement = this.exists(
                    await tx.collectionRepository.getElementVersionByVersionId(
                        elementVersionId
                    )
                );

                const content = sourceElement.content;
                content.name = `Kopie von ${content.name}`;

                const duplicatedElement = this.exists(
                    await tx.collectionRepository.createElementVersion({
                        content,
                        version: 1,
                    })
                );

                await tx.collectionRepository.addElementToCollection(
                    duplicatedElement.versionId,
                    draftState.versionId
                );

                eventBuffer.next({
                    event: 'element:create',
                    data: duplicatedElement,
                    collectionEntityId: targetCollectionEntity,
                });

                return {
                    duplicatedElement,
                    draftState,
                };
            }
        );
    }

    public async duplicateCollectionVersion(
        collectionVersionId: CollectionVersionId,
        owner: string
    ) {
        return this.collectionRepository.transaction(async (tx) => {
            const latestCollectionEntity =
                await tx.getCollectionByVersionId(collectionVersionId);

            if (!latestCollectionEntity) {
                throw new Error(
                    `No exercise element set found with entityId ${collectionVersionId}`
                );
            }

            const newCollection = await tx.createFirstCollectionVersion(
                // TODO: Quixelation : also duplicate description (visbility should stay private)
                `Kopie von ${latestCollectionEntity.title}`,
                true
            );

            await tx.setUserCollectionRelationship(
                owner,
                newCollection.entityId,
                'admin'
            );

            await tx.copyElementsBetweenCollections({
                source: {
                    versionId: collectionVersionId,
                    entityId: latestCollectionEntity.entityId,
                },
                target: newCollection,
            });

            await tx.copyDependenciesBetweenCollections({
                sourceVersion: collectionVersionId,
                targetVersion: newCollection.versionId,
            });

            await tx.saveDraftState(newCollection.entityId);

            return newCollection;
        });
    }

    private async getRelevantTransitiveDependenciesForElementVersion(
        element: ElementDto,
        collectionVersionId: CollectionVersionId
    ): Promise<ElementDto[]> {
        const elementDependencies =
            await this.getDependenciesOfElement(element);

        const relevantDependencies: {
            collection: CollectionVersionId;
            element: ElementDto;
        }[] = [];

        await Promise.all(
            elementDependencies.map(async (dependency) => {
                const collectionOfDependency =
                    await this.collectionRepository.getLatestCollectionOfElementEntity(
                        dependency.entityId
                    );
                if (!collectionOfDependency) {
                    console.warn(
                        `Could not find containing collection for element with id ${dependency.entityId} while checking dependencies for element version ${element.versionId}`
                    );
                    return;
                }
                if (collectionOfDependency.versionId === collectionVersionId) {
                    return;
                }
                relevantDependencies.push({
                    collection: collectionOfDependency.versionId,
                    element: dependency,
                });
            })
        );
        const transitiveRelevantDependencies = (
            await Promise.all(
                relevantDependencies.map(async (relevantDependency) =>
                    this.getRelevantTransitiveDependenciesForElementVersion(
                        relevantDependency.element,
                        relevantDependency.collection
                    ).then((subDependencies) =>
                        subDependencies.map((subDependency) => ({
                            collection: relevantDependency.collection,
                            element: subDependency,
                        }))
                    )
                )
            )
        ).flat();

        return [...relevantDependencies, ...transitiveRelevantDependencies].map(
            (dep) => dep.element
        );
    }

    public async upgradeAllElementStateVersionsToLatest(): Promise<number> {
        return this.collectionRepository.transaction(async (tx) => {
            const allElements = await tx.UNSAFE_getAllElements();

            const allElementVersions = new Set<number>();
            allElements.forEach((element) =>
                allElementVersions.add(element.stateVersion)
            );

            if (allElementVersions.size === 0) return 0;
            if (allElementVersions.size > 1) {
                throw new Error(
                    `There are multiple stateversions present in the element table. This should not happen and indicates a problem with the migration script.`
                );
            }
            const currentElementVersion = allElementVersions
                .values()
                .next().value!;
            if (ExerciseState.currentStateVersion === currentElementVersion) {
                return 0;
            }

            let state = cloneDeepMutable(
                ExerciseState.create(
                    '123456' as ParticipantKey
                ) as WritableDraft<ExerciseState>
            );

            // TODO: Change this as soon as we have the new state structure with step 2 of marketplace
            state = Object.assign(state, {
                templates: allElements.reduce<{
                    [T in ElementEntityId]: WritableDraft<VehicleTemplate>;
                }>((acc, element) => {
                    if (element.content.type !== 'vehicleTemplate') return acc;
                    acc[element.entityId] = {
                        ...cloneDeepMutable(element.content),
                        versionId: element.versionId,
                        entityId: element.entityId,
                    };
                    return acc;
                }, {}),
                alarmGroups: allElements.reduce<{
                    [T in ElementEntityId]: WritableDraft<VehicleTemplate>;
                }>((acc, element) => {
                    if (element.content.type !== 'vehicleTemplate') return acc;
                    acc[element.entityId] = {
                        ...cloneDeepMutable(element.content),
                        versionId: element.versionId,
                        entityId: element.entityId,
                    };
                    return acc;
                }, {}),
            } satisfies { [T in keyof ExerciseState]?: any });

            // Asserted value as we check for set-size of =1 above
            const migratedState = applyMigrations(currentElementVersion, {
                currentState: state,
                history: undefined,
            });

            const affectedElementCount = await tx.UNSAFE_overwriteElements(
                migratedState.newVersion,
                [
                    ...Object.values(
                        migratedState.migratedProperties.currentState.templates
                    ).filter(isVersionedElementContent),
                ]
            );

            return affectedElementCount;
        });
    }
}
