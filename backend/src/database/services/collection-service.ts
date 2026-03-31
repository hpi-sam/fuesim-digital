import {
    CollectionDto,
    CollectionEntityId,
    CollectionVersionId,
    ElementDto,
    ElementEntityId,
    ElementVersionId,
    elementVersionIdSchema,
    isElementVersionId,
    Marketplace,
    VersionedElementContent,
    VersionedElementPartial,
} from 'fuesim-digital-shared';
import type { z } from 'zod';
import { Subject } from 'rxjs';
import type { CollectionRepository } from '../repositories/collection-repository.js';

export class CollectionService {
    public transaction<T>(
        operation: (tx: CollectionService) => Promise<T>
    ): Promise<T> {
        return this.collectionRepository.transaction(async (tx) => {
            const serviceCopy = new CollectionService(tx, this.eventSubject);
            return await operation(serviceCopy);
        });
    }

    public get events() {
        return this.eventSubject.asObservable();
    }

    private readonly newDeferredEventBuffer = () => {
        // I opted against a ReplaySubject here to not worry about completing correctly if a functions throws
        // and doesnt complete this subject
        const subject: (typeof Marketplace.Set.Events.Event.Type)[] = [];

        return {
            next: (event: typeof Marketplace.Set.Events.Event.Type) => {
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

    private exists<T>(
        elementName: string,
        element: T | null | undefined
    ): NonNullable<T> {
        if (!element) {
            throw new Error(`No ${elementName} found`);
        }
        return element;
    }

    constructor(
        private readonly collectionRepository: CollectionRepository,
        private readonly eventSubject = new Subject<
            typeof Marketplace.Set.Events.Event.Type
        >()
    ) { }

    public async createCollection(name: string, owner: string) {
        return this.collectionRepository.createFirstCollectionVersion(
            name,
            owner
        );
    }

    public async updateCollectionMetadata(
        collectionEntityId: CollectionEntityId,
        data: Marketplace.Set.EditableCollectionProperties
    ) {
        return this.collectionRepository.transaction(async (tx) => {
            const [draftState, createdNewDraftState] =
                await tx.getOrCreateDraftState(collectionEntityId);

            const updatedCollection = await tx.updateCollectionData(
                draftState.versionId,
                data
            );

            if (updatedCollection === null) {
                throw new Error('Failed to update collection metadata');
            }

            this.eventSubject.next({
                event: 'collection:update',
                data: updatedCollection,
                collectionEntityId,
            });

            return updatedCollection;
        });
    }

    public async removeCollectionDependency(data: {
        removeFrom: CollectionEntityId;
        dependencyEntityId: CollectionVersionId;
    }) {
        return this.collectionRepository.transaction(async (tx) => {
            const [draftState, createdNewDraftState] =
                await tx.getOrCreateDraftState(data.removeFrom);

            await tx.removeCollectionVersionDependency(
                draftState.versionId,
                data.dependencyEntityId
            );

            if (createdNewDraftState) {
                this.eventSubject.next({
                    event: 'collection:update',
                    data: draftState,
                    collectionEntityId: data.removeFrom,
                });
            }

            return draftState;
        });
    }

    public async saveDraftState(collectionEntityId: CollectionEntityId) {
        const data =
            await this.collectionRepository.saveDraftState(collectionEntityId);

        this.eventSubject.next({
            event: 'collection:update',
            data,
            collectionEntityId,
        });

        return data;
    }

    public getCollectionElementDiff(
        currentDependencyElements: ElementDto[],
        newDependencyElements: ElementDto[]
    ) {
        console.log(currentDependencyElements);
        console.log(newDependencyElements);
        const currentElementEntityIds = new Set(
            currentDependencyElements.map((element) => element.entityId)
        );
        const newElementEntityIds = new Set(
            newDependencyElements.map((element) => element.entityId)
        );

        const removed = currentDependencyElements.filter(
            (element) => !newElementEntityIds.has(element.entityId)
        );
        const added = newDependencyElements.filter(
            (element) => !currentElementEntityIds.has(element.entityId)
        );

        const overlappingNew = newDependencyElements.filter((element) =>
            currentElementEntityIds.has(element.entityId)
        );

        // TODO: @Quixelation -> we should also do a content diff, to see if the content was actually significantly changed
        // But this is something for a later point (ba-thesis?)
        const potentiallyUpdated = overlappingNew
            .map((newElement) => {
                const matchingCurrentElement = currentDependencyElements.find(
                    (element) => element.entityId === newElement.entityId
                );
                if (!matchingCurrentElement) {
                    throw new Error(
                        'This should not happen, since we are filtering for overlapping elements'
                    );
                }
                if (newElement.versionId !== matchingCurrentElement.versionId) {
                    return {
                        old: matchingCurrentElement,
                        new: newElement,
                    };
                } else return null;
            })
            .filter((v) => v != null);

        return {
            removed,
            updated: potentiallyUpdated,
            added,
        };
    }

    public async checkRequiredChangesForDependencyUpgrade(data: {
        dependingCollection: CollectionVersionId;
        currentDependencyVersion: CollectionVersionId;
        nextDependencyVersion: CollectionVersionId;
    }) {
        const currentDependencyElements =
            await this.getElementsOfCollectionVersion(
                data.currentDependencyVersion,
                {
                    includeDependencies: false,
                    allowDraftState: true,
                }
            );
    }

    public async addCollectionDependency(
        data: {
            importTo: CollectionEntityId;
            importFrom: CollectionVersionId;
        },
        opts: { throwOnDraftState: boolean } = { throwOnDraftState: true }
    ) {
        const { throwOnDraftState } = opts;
        return this.transaction(async (tx) => {
            const eventBuffer = tx.newDeferredEventBuffer();
            const [draftState, createdNewDraftState] = tx.exists(
                'set version',
                await tx.collectionRepository.getOrCreateDraftState(
                    data.importTo
                )
            );

            eventBuffer.next({
                event: 'collection:update',
                data: draftState,
                collectionEntityId: data.importTo,
            });

            let importFromCollection = tx.exists(
                'collection version to import',
                await tx.collectionRepository.getCollectionByVersionId(
                    data.importFrom
                )
            );

            await tx.checkIfDependencyCanBeAdded({
                importTo: draftState.versionId,
                dependencyVersionId: importFromCollection.versionId,
            });

            if (importFromCollection.draftState) {
                if (throwOnDraftState) {
                    throw new Error(
                        `Collection version with id ${data.importFrom} is in draft state and can not be imported`
                    );
                } else {
                    const nonDraftStateCollection =
                        await tx.collectionRepository.getLatestCollectionByEntityId(
                            importFromCollection.entityId,
                            { allowDraftState: false }
                        );
                    if (nonDraftStateCollection === null) {
                        throw new Error(
                            `Collection with id ${importFromCollection.entityId} has no non-draft version and can not be imported`
                        );
                    }
                    importFromCollection = nonDraftStateCollection;
                }
            }

            //TODO:
            // - Check if dep entityID already exists for this collection version
            //      -> if yes, if not same version, do migration checks
            //      -> if no, just add dependency

            const existingDependencies = await tx.getCollectionDependencies(
                draftState.versionId
            );
            const isAlreadyDependent = existingDependencies.find(
                (dep) => dep.entityId === importFromCollection.entityId
            );
            if (isAlreadyDependent !== undefined) {
                await tx.collectionRepository.removeCollectionVersionDependency(
                    draftState.versionId,
                    isAlreadyDependent.versionId
                );
                await tx.collectionRepository.addCollectionVersionDependency(
                    draftState.versionId,
                    importFromCollection.versionId
                );

                console.log('REPLACEMENRT');
                eventBuffer.next({
                    event: 'dependency:add',
                    collectionEntityId: data.importTo,
                    data: importFromCollection.versionId,
                });
            } else {
                await tx.collectionRepository.addCollectionVersionDependency(
                    draftState.versionId,
                    importFromCollection.versionId
                );
                console.log('ADDITION');
                eventBuffer.next({
                    event: 'dependency:add',
                    data: importFromCollection.versionId,
                    collectionEntityId: data.importTo,
                });
            }

            const newlyImportedElements = tx.exists(
                'elements from imported collection ',
                await tx.collectionRepository.getElementsOfCollectionVersion(
                    importFromCollection.versionId
                )
            );

            eventBuffer.flush();

            return {
                collection: importFromCollection,
                elements: newlyImportedElements,
                newCollectionVersion: draftState,
            };
        });
    }

    public async createExerciseObject(
        setEntityId: CollectionEntityId,
        content: VersionedElementContent
    ) {
        return this.collectionRepository.transaction(async (tx) => {
            const eventBuffer = this.newDeferredEventBuffer();

            const result = this.exists(
                'new element',
                await tx.createElementVersion({
                    version: 1,
                    content,
                })
            );

            eventBuffer.next({
                event: 'element:create',
                data: result,
                collectionEntityId: setEntityId,
            });

            if (!result) {
                throw new Error('Failed to create exercise element object');
            }

            const [draftState, createdNewDraftState] =
                await tx.getOrCreateDraftState(setEntityId);
            if (createdNewDraftState) {
                eventBuffer.next({
                    event: 'collection:update',
                    data: draftState,
                    collectionEntityId: setEntityId,
                });
            }

            await tx.addElementToCollection(
                result.versionId,
                draftState.versionId
            );

            eventBuffer.flush();

            return {
                newSetVersionId: draftState.versionId,
                result,
            };
        });
    }

    public async getLatestCollectionsForUser(
        userId: string,
        opts: { includeDraftState: boolean }
    ) {
        return this.collectionRepository.getLatestCollectionForUser(userId, {
            allowDraftState: opts.includeDraftState,
        });
    }

    public async getLatestCollectionById(
        setEntityId: CollectionEntityId,
        opts: { draftState: boolean }
    ): Promise<CollectionDto | null> {
        return this.collectionRepository.getLatestCollectionByEntityId(
            setEntityId,
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
        entity: CollectionEntityId,
        opts: { includeDependencies: boolean }
    ) {
        const latestConnection = this.exists(
            'latestCollection',
            await this.collectionRepository.getLatestCollectionByEntityId(
                entity,
                { allowDraftState: true }
            )
        );

        const elements = await this.getElementsOfCollectionVersion(
            latestConnection.versionId,
            {
                includeDependencies: opts.includeDependencies,
                allowDraftState: true,
            }
        );

        return elements;
    }

    private async getFullFlatDependencyTree(
        collectionVersionId: CollectionVersionId,
        visited: Set<CollectionVersionId> = new Set()
    ) {
        if (visited.has(collectionVersionId)) {
            console.warn(
                `Circular dependency detected for collection version ${collectionVersionId}`
            );
            return [];
        }

        visited.add(collectionVersionId);

        const deps =
            await this.collectionRepository.getCollectionVersionDirectDependencies(
                collectionVersionId
            );

        const allDeps = [...deps];

        for (const dep of deps) {
            const subDeps = await this.getFullFlatDependencyTree(
                dep.collectionVersionId,
                visited
            );
            allDeps.push(...subDeps);
        }

        return allDeps;
    }

    public async getElementsOfCollectionVersion(
        collectionVersionId: CollectionVersionId,
        opts: {
            includeDependencies?: boolean;
            allowDraftState: boolean;
        }
    ): Promise<{
        direct: ElementDto[];
        transitive?: z.infer<
            typeof Marketplace.Set.transitiveCollectionSchema
        >[];
    }> {
        const { includeDependencies: Opt_includeDependencies } = opts || {
            includeDependencies: false,
        };

        const baseCollection = this.exists(
            'collection for version',
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

        if (Opt_includeDependencies === false) {
            return { direct: directCollectionElements };
        }
        const dependentCollectionVersions =
            await this.getFullFlatDependencyTree(collectionVersionId);

        const dependentCollectionElements = await Promise.all(
            dependentCollectionVersions.map(async (dependency) =>
                Promise.all([
                    this.exists(
                        'collection for dependency',
                        this.getCollectionVersionById(
                            dependency.collectionVersionId
                        )
                    ),
                    this.exists(
                        'elements for collection-dependency',
                        this.collectionRepository.getElementsOfCollectionVersion(
                            dependency.collectionVersionId
                        )
                    ),
                ])
            )
        );

        const dependencies = dependentCollectionElements.map(
            ([collection, elements]) =>
                ({
                    collection: collection!,
                    elements,
                }) satisfies z.infer<
                    typeof Marketplace.Set.GetLatestElementsBySetVersionId.responseSchema.shape.transitive.element
                >
        );

        return {
            direct: directCollectionElements,
            transitive: dependencies,
        };
    }

    public async deleteCollection(setEntityId: CollectionEntityId) {
        // TODO: @Quixelation - forbid, if set is public, and do some other checks
    }

    public async getExerciseElementObjectVersions(entityId: ElementEntityId) {
        return this.collectionRepository.getElementVersions(entityId);
    }

    private async isElementInLatestCollectionVersion(
        elementEntityId: ElementEntityId
    ): Promise<[boolean, CollectionDto]> {
        const latestContainingCollection = this.exists(
            'element set',
            await this.collectionRepository.getLatestCollectionOfElementEntity(
                elementEntityId
            )
        );
        const latestVersionOfContainingCollection = this.exists(
            'latest version of element set',
            await this.collectionRepository.getLatestCollectionByEntityId(
                latestContainingCollection.entityId,
                { allowDraftState: true }
            )
        );

        if (
            latestVersionOfContainingCollection?.versionId !==
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
                'latest exercise element',
                await tx.collectionRepository.getLatestElementVersion(entityId)
            );

            let newElementVersion: ElementDto;


            // Check if we have other elements in this collection, which
            // depend on the element we want to update.
            // If we do, check if we have accounted for them in the resolutionStrategy
            const dependingElements = await tx.getDependingElements(latestElementVersion, draftState.versionId);
            if (dependingElements.length > 0) {
                if (!resolutionStrategy) {
                    throw new Error("depending elements exist, but no resolution strategy provided")
                }
                else if (!dependingElements.every(de => resolutionStrategy.affectingElementIds.includes(de.versionId))) {
                    throw new Error("the provided resolution strategy does not account for all depending elements.")
                }

            }


            const elementMapping =
                await tx.collectionRepository.getElementCollectionMapping(
                    latestElementVersion.versionId,
                    draftState.versionId
                );

            if (resolutionStrategy?.strategy === 'createCopy') {
                const duplicatedElement = await tx.createExerciseObject(
                    latestContainingCollection.entityId,
                    content
                );
                newElementVersion = tx.exists(
                    'duplicated element',
                    duplicatedElement.result
                );
            } else if (elementMapping.isBaseReference === true) {
                // just overwrite the already mapped element
                // if it is the base reference in the current draftstate
                // and therefore not referenced by any other collection version
                newElementVersion = tx.exists(
                    'updated element',
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
                    'new exercise element',
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
                for (const dependingElement of dependingElements) {
                    const newContent = JSON.parse(
                        JSON.stringify(
                            dependingElement.content
                        ).replaceAll(latestElementVersion.versionId, newElementVersion.versionId)
                    );
                    await tx.updateElement(dependingElement.entityId, newContent, resolutionStrategy);
                }
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
    private async getDependenciesOfElement(element: ElementDto): Promise<ElementDto[]> {
        const directElementReferences = (
            await Promise.all(
                this.findEntityVersionsInContent(element.content).map(
                    (elementVersionId) =>
                        this.collectionRepository.getElementVersionByVersionId(
                            elementVersionId
                        )
                )
            )
        ).filter((elem) => elem !== null);


        const transitiveElementReferences = (await Promise.all(
            directElementReferences.map((directReference) =>
                this.getDependenciesOfElement(directReference))
        )).flat();


        return [...directElementReferences, ...transitiveElementReferences];
    }

    public async deleteElementFromCollection(
        elementEntityId: ElementEntityId
    ): Promise<typeof Marketplace.Element.Delete.Response> {
        let response: typeof Marketplace.Element.Delete.Response | undefined =
            undefined;
        try {
            return await this.transaction(async (tx) => {
                const eventBuffer = tx.newDeferredEventBuffer();

                const containingSet = tx.exists(
                    'containing set',
                    await tx.collectionRepository.getLatestCollectionOfElementEntity(
                        elementEntityId
                    )
                );

                const [
                    elementIsInLatestCollectionVersion,
                    _latestContainingSet,
                ] =
                    await this.isElementInLatestCollectionVersion(
                        elementEntityId
                    );

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
                    'latest exercise element',
                    await tx.collectionRepository.getLatestElementVersion(
                        elementEntityId
                    )
                );

                const dependingElements = await tx.getDependingElements(
                    latestElementVersion,
                    draftState.versionId
                );
                console.log(JSON.stringify(dependingElements, null, 2));
                if (dependingElements.length > 0) {
                    response = {
                        newSetVersionId: null,
                        requiresConfirmation: dependingElements.map(
                            (dependingElement) => ({
                                element: dependingElement,
                                blocking: true,
                            })
                        ),
                    };
                    throw new Error(
                        `Element with id ${elementEntityId} is still referenced by other elements in the collection and can therefore not be deleted without confirmation.`
                    );
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
                        latestElementVersion.versionId
                    );
                } else {
                    // unmap the reference to the element since it is not the base reference
                    // and therefore belongs to a different collection version
                    await tx.collectionRepository.unmapElementFromCollection(
                        elementEntityId,
                        draftState.versionId
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
        } catch (err) {
            if (response !== undefined) {
                return response;
            }
            throw err;
        }
    }

    /**
     * Fetches all elements inside a collection which depend on the given element
     *
     * INCLUDES TRANSITIVE
     */
    public async getDependingElements(
        element: VersionedElementPartial,
        collectionVersionId: CollectionVersionId
    ) {
        const elementsInCollection =
            await this.collectionRepository.getElementsOfCollectionVersion(
                collectionVersionId
            );

        // TODO: @Quixelation - check if circular dependencies can cause performance issues here
        const dependingElements = (
            await Promise.all(
                elementsInCollection.map(async (element) => ({
                    element,
                    dependsOn:
                        await this.getDependenciesOfElement(element),
                }))
            )
        )
            .filter((f) =>
                f.dependsOn.some(
                    (dependency) => dependency?.entityId === element.entityId
                )
            )
            .map((m) => m.element);

        return dependingElements;
    }

    public async makeCollectionPublic(setEntityId: CollectionEntityId) {
        const data = await this.collectionRepository.setCollectionVisibility(
            setEntityId,
            'public'
        );

        this.eventSubject.next({
            event: 'collection:update',
            data,
            collectionEntityId: setEntityId,
        });

        return data;
    }

    public async duplicateElementVersion(
        elementVersionId: ElementVersionId,
        targetCollectionEntity: CollectionEntityId
    ) {
        return this.collectionRepository.transaction(async (tx) => {
            const eventBuffer = this.newDeferredEventBuffer();
            const [draftState, createdNewDraftState] =
                await tx.getOrCreateDraftState(targetCollectionEntity);

            if (createdNewDraftState) {
                eventBuffer.next({
                    event: 'collection:update',
                    data: draftState,
                    collectionEntityId: targetCollectionEntity,
                });
            }

            const sourceElement = this.exists(
                'source element version',
                await tx.getElementVersionByVersionId(elementVersionId)
            );

            const duplicatedElement = this.exists(
                'duplicated elemnen',
                await tx.createElementVersion({
                    content: sourceElement.content,
                    version: 1,
                })
            );

            await tx.addElementToCollection(
                duplicatedElement.versionId,
                draftState.versionId
            );

            eventBuffer.next({
                event: 'element:create',
                data: duplicatedElement,
                collectionEntityId: targetCollectionEntity,
            });

            eventBuffer.flush();

            return {
                duplicatedElement,
                draftState,
            };
        });
    }

    public async duplicateCollectionVersion(
        collectionVersionId: CollectionVersionId,
        owner: string
    ) {
        const latestCollectionEntity =
            await this.collectionRepository.getCollectionByVersionId(
                collectionVersionId
            );

        if (!latestCollectionEntity) {
            throw new Error(
                `No exercise element set found with entityId ${collectionVersionId}`
            );
        }

        const newCollection =
            await this.collectionRepository.createFirstCollectionVersion(
                // TODO: Quixelation : also duplicate description (visbility should stay private)
                `Kopie von ${latestCollectionEntity.title}`,
                owner,
                true
            );

        if (!newCollection) {
            throw new Error('Failed to create new exercise element set');
        }

        await this.collectionRepository.copyElementsBetweenCollections({
            source: {
                versionId: collectionVersionId,
                entityId: latestCollectionEntity.entityId,
            },
            target: newCollection,
        });

        await this.collectionRepository.copyDependenciesBetweenCollections({
            sourceVersion: collectionVersionId,
            targetVersion: newCollection.versionId,
        });

        return newCollection;
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
        for (let dependency of elementDependencies) {
            const collectionOfDependency =
                await this.collectionRepository.getLatestCollectionOfElementEntity(
                    dependency.entityId
                );
            if (!collectionOfDependency) {
                console.warn(
                    `Could not find containing collection for element with id ${dependency.entityId} while checking dependencies for element version ${element}`
                );
                continue;
            }
            if (collectionOfDependency.versionId === collectionVersionId) {
                console.debug(
                    `Dependency with element version id ${dependency.versionId} is directly in the same collection version ${collectionVersionId} and is therefore NOT relevant`
                );
                continue;
            }
            relevantDependencies.push({
                collection: collectionOfDependency.versionId,
                element: dependency,
            });
        }
        for (let relevantDependency of relevantDependencies) {
            const subDependencies =
                await this.getRelevantTransitiveDependenciesForElementVersion(
                    relevantDependency.element,
                    relevantDependency.collection
                );
            relevantDependencies.push(
                ...subDependencies.map((subDependency) => ({
                    collection: relevantDependency.collection,
                    element: subDependency,
                }))
            );
        }
        return relevantDependencies.map((dep) => dep.element);
    }

    /**
     * @deprecated do not use yet - impl. not finished
     */
    public async checkIfDependencyCanBeAdded(data: {
        importTo: CollectionVersionId;
        dependencyVersionId: CollectionVersionId;
    }) {
        const baseCollectionDependencies =
            await this.collectionRepository.getCollectionVersionDirectDependencies(
                data.importTo
            );

        const updatedCollectionDependencies = [
            ...baseCollectionDependencies.map(
                (dependency) => dependency.collectionVersionId
            ),
            data.dependencyVersionId,
        ];

        const relevantTransitiveDependencies = await Promise.all(
            updatedCollectionDependencies.map(async (dependencyVersionId) => {
                const elements =
                    await this.collectionRepository.getElementsOfCollectionVersion(
                        dependencyVersionId
                    );
                const relevantDependenciesForElements = await Promise.all(
                    elements.map((element) =>
                        this.getRelevantTransitiveDependenciesForElementVersion(
                            element,
                            dependencyVersionId
                        )
                    )
                );
                return relevantDependenciesForElements.flat();
            })
        ).then((results) => results.flat());

        console.log({ relevantTransitiveDependencies });

        const versionIdsPerEntityId = relevantTransitiveDependencies.reduce<
            Record<ElementEntityId, ElementDto[]>
        >((acc, element) => {
            if (acc[element.entityId] === undefined) {
                acc[element.entityId] = [];
            }
            acc[element.entityId]?.push(element);
            return acc;
        }, {});

        console.log({ versionIdsPerEntityId });

        return;

        ///////////////////////////////////////////////////////////////////////
        const importingDependencyTree = await this.getFullFlatDependencyTree(
            data.dependencyVersionId
        );

        // Check if the importing dependency *ENTITIY* is already in the dependency tree of the base collection
        const overlappingDependenciesEntities =
            baseCollectionDependencies.filter((baseDependency) =>
                importingDependencyTree.some(
                    (importingDependency) =>
                        importingDependency.collectionEntityId ===
                        baseDependency.collectionEntityId
                )
            );

        // TODO: Replace with groupBy once available with new tsconfig target
        const overlappingDependencyEntities =
            overlappingDependenciesEntities.reduce<
                Record<
                    CollectionEntityId,
                    Awaited<
                        ReturnType<
                            typeof CollectionService.prototype.getFullFlatDependencyTree
                        >
                    >
                >
            >((acc, dependency) => {
                if (acc[dependency.collectionEntityId] === undefined) {
                    acc[dependency.collectionEntityId] = [];
                }
                acc[dependency.collectionEntityId]?.push(dependency);
                return acc;
            }, {});

        for (const overlappingDependency of Object.entries(
            overlappingDependencyEntities
        )) {
            const [entityId, versions] = overlappingDependency;
            if (versions.length === 0) {
                // This should not happen, but i included it for safer assertions
                continue;
            }
            // Alle VersionsIDs sind gleich
            if (
                versions.every(
                    (version) =>
                        version.collectionVersionId ===
                        versions[0]!.collectionVersionId
                )
            ) {
                // TODO: Return accepted
                return;
            }

            // Schauen, ob es eine gemeinsame kompatible Version gibt
            const allInterconnctedDependencies = await Promise.all(
                versions.map((version) => async () => {
                    const element = this.exists(
                        'dependency element',
                        await this.collectionRepository.getCollectionByVersionId(
                            version.collectionVersionId
                        )
                    );
                    const idsInContent =
                        this.findEntityVersionsInContent(element);
                })
            );
        }
    }

    private findEntityVersionsInContent(
        content: any[] | object | string | null | undefined,
    ): ElementVersionId[] {
        if (content === null || content === undefined) {
            return [];
        } else if (typeof content === 'string') {
            if (isElementVersionId(content)) {
                return [content];
            } else return [];
        } else if (Array.isArray(content)) {
            const foundDependencies: ElementVersionId[] = [];
            for (const item of content) {
                const subDependencies = this.findEntityVersionsInContent(item);
                foundDependencies.push(...subDependencies);
            }
            return foundDependencies;
        } else if (typeof content === 'object') {
            const foundDependencies: ElementVersionId[] = [];
            for (const value of Object.values(content)) {
                const subDependencies = this.findEntityVersionsInContent(value);
                foundDependencies.push(...subDependencies);
            }
            return foundDependencies;
        }

        return [];
    }
}
