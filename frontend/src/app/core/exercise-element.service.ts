import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
    CollectionDto,
    CollectionEntityId,
    CollectionRelationshipType,
    CollectionVersionId,
    ElementEntityId,
    Marketplace,
    VersionedCollectionPartial,
    VersionedElementPartial,
} from 'fuesim-digital-shared';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

export interface ExerciseElementSetSubscriptionData {
    collection: CollectionDto;
    objects: typeof Marketplace.Collection.GetLatestElementsBySetVersionId.Response;
    ownRole: CollectionRelationshipType;
}

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private readonly httpClient = inject(HttpClient);
    private readonly messageService = inject(MessageService);

    public readonly ENDPOINT = `${httpOrigin}/api/collections`;
    private readonly _collections = signal<CollectionDto[]>([]);
    private readonly _collectionSubscriptions = new Map<
        CollectionEntityId,
        BehaviorSubject<ExerciseElementSetSubscriptionData | null>
    >();

    public get collections() {
        return this._collections.asReadonly();
    }

    public subscribeToCollection(
        setEntityId: CollectionEntityId,
        callback: (data: ExerciseElementSetSubscriptionData) => void
    ): () => void {
        const collectionEventSource = new EventSource(
            `${this.ENDPOINT}/${setEntityId}/events`,
            { withCredentials: true }
        );

        this._collectionSubscriptions.set(
            setEntityId,
            new BehaviorSubject<ExerciseElementSetSubscriptionData | null>(null)
        );
        collectionEventSource.addEventListener('change', (event) => {
            const changeEvent =
                Marketplace.Collection.Events.SSEvent.schema.parse(
                    JSON.parse(event.data)
                );

            switch (changeEvent.event) {
                case 'initialdata': {
                    this._collectionSubscriptions.get(setEntityId)?.next({
                        collection: changeEvent.data.collection,
                        objects: changeEvent.data.elements,
                        ownRole: changeEvent.data.userRelationship,
                    });
                    break;
                }
                case 'element:create': {
                    const currentValue = this._collectionSubscriptions
                        .get(setEntityId)
                        ?.getValue();
                    if (!currentValue) return;
                    const newValue = {
                        ...currentValue,
                        objects: {
                            ...currentValue.objects,
                            direct: [
                                ...currentValue.objects.direct,
                                changeEvent.data,
                            ],
                        },
                    };
                    this._collectionSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }
                case 'element:update': {
                    const currentValue = this._collectionSubscriptions
                        .get(setEntityId)
                        ?.getValue();
                    if (!currentValue) return;
                    const newValue = {
                        ...currentValue,
                        objects: {
                            ...currentValue.objects,
                            direct: currentValue.objects.direct.map((object) =>
                                object.entityId === changeEvent.data.entityId
                                    ? changeEvent.data
                                    : object
                            ),
                        },
                    };
                    this._collectionSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }

                case 'element:delete': {
                    const currentValue = this._collectionSubscriptions
                        .get(setEntityId)
                        ?.getValue();
                    if (!currentValue) return;
                    const newValue = {
                        ...currentValue,
                        objects: {
                            ...currentValue.objects,
                            direct: currentValue.objects.direct.filter(
                                (object) =>
                                    object.entityId !==
                                    changeEvent.data.entityId
                            ),
                        },
                    };
                    this._collectionSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }

                case 'dependency:add': {
                    // THIS EVENT DOES NOT NEED TO BE HANDLED BY FRONTEND
                    // dependency:replace-data is the important event here
                    break;
                }

                case 'dependency:replace-data': {
                    const currentValue = this._collectionSubscriptions
                        .get(setEntityId)
                        ?.getValue();
                    if (!currentValue) return;
                    const newValue = {
                        ...currentValue,
                        objects: {
                            direct: currentValue.objects.direct,
                            transitive: changeEvent.data,
                        },
                    };
                    this._collectionSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }

                case 'collection:update': {
                    this._collections.update((collections) =>
                        collections.map((collection) =>
                            collection.entityId === setEntityId
                                ? {
                                      ...collection,
                                      title: changeEvent.data.title,
                                      description: changeEvent.data.description,
                                  }
                                : collection
                        )
                    );

                    const currentValue = this._collectionSubscriptions
                        .get(setEntityId)
                        ?.getValue();
                    if (!currentValue) return;
                    const newValue = {
                        ...currentValue,
                        collection: changeEvent.data,
                    };
                    this._collectionSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }
                default: {
                    console.warn(
                        `Unhandled event type ${changeEvent} for setEntityId ${setEntityId}`
                    );
                }
            }
        });

        collectionEventSource.onerror = (error) => {
            console.error(
                `Error in EventSource for setEntityId ${setEntityId}:`,
                error
            );
            this.messageService.postError({
                title: 'Verbindungsfehler',
                body: 'Die Verbindung zum Server wurde unterbrochen. Bitte überprüfen Sie Ihre Internetverbindung und laden Sie die Seite neu.',
            });
        };
        const firstValue = this._collectionSubscriptions
            .get(setEntityId)
            ?.getValue();
        if (firstValue) {
            callback(firstValue);
        }
        this._collectionSubscriptions.get(setEntityId)!.subscribe((data) => {
            if (!data) return;
            callback(data);
        });

        return () => {
            collectionEventSource.close();
            this._collectionSubscriptions.get(setEntityId)?.complete();
            this._collectionSubscriptions.delete(setEntityId);
        };
    }

    public async loadCollections() {
        const data = await lastValueFrom(
            this.httpClient.get<typeof Marketplace.Collection.LoadMy.Response>(
                `${this.ENDPOINT}/my`
            )
        );

        this._collections.set(data.result);
    }

    public async getLatestCollectionVersionByEntityId(
        entityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetByEntityId.Response
            >(`${this.ENDPOINT}/${entityId}`)
        );

        return data.result;
    }

    public async updateCollectionData(
        collectionEntityId: CollectionEntityId,
        data: Marketplace.Collection.EditableCollectionProperties
    ) {
        const response = await lastValueFrom(
            this.httpClient.patch<typeof Marketplace.Collection.Edit.Response>(
                `${this.ENDPOINT}/${collectionEntityId}`,
                Marketplace.Collection.Edit.requestSchema.parse(data)
            )
        );

        const parsedData =
            Marketplace.Collection.Edit.responseSchema.parse(response);

        this.messageService.postMessage({
            color: 'success',
            title: 'Sammlung aktualisiert',
            body: 'Die Sammlungsdaten wurden erfolgreich aktualisiert.',
        });

        return parsedData.result;
    }

    public async getLatestElementsByCollectionId(setId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetLatestElementsBySetVersionId.Response
            >(`${this.ENDPOINT}/${setId}/latest`)
        );

        return data;
    }

    public async deleteElement(
        elementEntityId: ElementEntityId,
        setEntityId: CollectionEntityId
    ) {
        const result = await lastValueFrom(
            this.httpClient.delete<typeof Marketplace.Element.Delete.Response>(
                `${this.ENDPOINT}/${setEntityId}/element/${elementEntityId}`
            )
        );
        // TODO: Make this interface nicer / with confirm button
        if (result.requiresConfirmation.length > 0) {
            this.messageService.postError({
                title: 'Entfernen nicht möglich',
                body: `Zu löschendes Element muss zuerst aus folgenden anderen Elementen entfernt werden: ${result.requiresConfirmation.map((e) => e.element.title).join(', ')}.`,
            });
        }
    }

    public async createColletion(title: string) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Collection.Create.Response>(
                `${this.ENDPOINT}/create`,
                {
                    title,
                } satisfies typeof Marketplace.Collection.Create.Request
            )
        );

        this._collections.update((elementSets) => [
            ...elementSets,
            data.result,
        ]);
    }

    public async createElement(
        setEntityId: CollectionEntityId,
        content: object
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Create.Response>(
                `${this.ENDPOINT}/${setEntityId}/create`,
                Marketplace.Element.Create.requestSchema.parse({
                    data: content,
                })
            )
        );

        return data.result;
    }

    public async getElementVersions(
        collection: CollectionEntityId,
        entityId: ElementEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Element.GetByEntityId.Response
            >(`${this.ENDPOINT}/${collection}/element/${entityId}/versions`)
        );

        return data.result;
    }

    public async updateElement(
        entityId: ElementEntityId,
        content: object,
        setEntityId: CollectionEntityId,
        conflictResolution?: Marketplace.Element.EditConflictResolution
    ) {
        const data = await lastValueFrom(
            this.httpClient.put<typeof Marketplace.Element.Edit.Response>(
                `${this.ENDPOINT}/${setEntityId}/element/${entityId}`,
                Marketplace.Element.Edit.requestSchema.parse({
                    data: content,
                    conflictResolution,
                })
            )
        );

        return data.result;
    }

    public async makeCollectionPublic(setEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.ChangeVisibility.Response
            >(
                `${this.ENDPOINT}/${setEntityId}/change-visibility`,
                Marketplace.Collection.ChangeVisibility.requestSchema.parse({
                    visibility: 'public',
                })
            )
        );

        this._collections.update((elementSets) =>
            elementSets.map((set) =>
                set.entityId === setEntityId
                    ? { ...set, visibility: 'public' }
                    : set
            )
        );

        const parsedData =
            Marketplace.Collection.ChangeVisibility.responseSchema.parse(data);

        return parsedData;
    }

    public async duplicateCollection(
        setVersionId: CollectionEntityId,
        specificSetVersionId: CollectionVersionId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.Duplicate.Response
            >(
                `${this.ENDPOINT}/${setVersionId}/version/${specificSetVersionId}/duplicate`,
                {}
            )
        );

        const parsedData =
            Marketplace.Collection.Duplicate.responseSchema.parse(data);

        this._collections.update((elementSets) => [
            ...elementSets,
            parsedData.createdSet,
        ]);
    }
    public async deleteCollection(setEntityId: CollectionEntityId) {
        await lastValueFrom(
            this.httpClient.delete(`${this.ENDPOINT}/${setEntityId}/entity`)
        );

        this._collections.update((val) =>
            val.filter((f) => f.entityId !== setEntityId)
        );
    }

    public async addCollectionDependency(opts: {
        importTo: CollectionEntityId;
        importFrom: CollectionVersionId;
    }) {
        await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Collection.Import.Response>(
                `${this.ENDPOINT}/${opts.importTo}/dependencies/${opts.importFrom}`,
                {}
            )
        );
    }

    public async removeCollectionDependency(opts: {
        removeFrom: CollectionEntityId;
        removeVersionId: CollectionVersionId;
    }) {
        await lastValueFrom(
            this.httpClient.delete(
                `${this.ENDPOINT}/${opts.removeFrom}/dependencies/${opts.removeVersionId}`
            )
        );
    }

    public async saveDraftState(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.SaveDraftState.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/save`, {})
        );

        const parsedData =
            Marketplace.Collection.SaveDraftState.responseSchema.parse(data);

        if (!parsedData.saved || parsedData.result === null) {
            this.messageService.postError({
                title: 'Sammlung konnte nicht gespeichert werden',
                body: 'Probieren Sie es erneut oder laden Sie die Seite neu.',
            });
            return;
        }

        this._collections.update((elementSets) =>
            elementSets.map((set) =>
                set.entityId === collectionEntityId
                    ? { ...set, draftState: data.result!.draftState }
                    : set
            )
        );
    }

    public async getElementsOfCollectionVersion(
        collection: VersionedCollectionPartial
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetElementsOfCollectionVersion.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}/elements`
            )
        );

        const typedData =
            Marketplace.Collection.GetElementsOfCollectionVersion.responseSchema.parse(
                data
            );

        return typedData;
    }

    public async getCollectionByVersionId(
        collection: VersionedCollectionPartial
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetCollectionVersion.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}`
            )
        );

        const typedData =
            Marketplace.Collection.GetCollectionVersion.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async getDependentElements(
        childElement: VersionedElementPartial,
        collection: VersionedCollectionPartial
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Element.GetInternalDependencies.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}/element/${childElement.entityId}/version/${childElement.versionId}/internaldependencies`
            )
        );

        const typedData =
            Marketplace.Element.GetInternalDependencies.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async checkNewerVersionAvailable(
        collection: VersionedCollectionPartial
    ): Promise<
        | {
              newerVersionAvailable: true;
              latestVersion: VersionedCollectionPartial;
          }
        | { newerVersionAvailable: false }
    > {
        const latestCollection =
            await this.getLatestCollectionVersionByEntityId(
                collection.entityId
            );
        const currentCollection =
            await this.getCollectionByVersionId(collection);

        if (latestCollection.version < currentCollection.version) {
            console.error(
                `Current collection version ${collection.versionId} is newer than latest collection version ${latestCollection.versionId}`
            );
        }

        if (latestCollection.version === currentCollection.version) {
            return { newerVersionAvailable: false };
        }
        return {
            newerVersionAvailable: true,
            latestVersion: {
                versionId: latestCollection.versionId,
                entityId: latestCollection.entityId,
            },
        };
    }

    async duplicateElement(opts: {
        collectionEntity: CollectionEntityId;
        element: VersionedElementPartial;
    }) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Duplicate.Response>(
                `${this.ENDPOINT}/${opts.collectionEntity}/element/${opts.element.entityId}/version/${opts.element.versionId}/duplicate`,
                {}
            )
        );

        const typedData =
            Marketplace.Element.Duplicate.responseSchema.parse(data);

        return typedData.result;
    }

    public async getMyCollections(includeDraftState: boolean = true) {
        const data = await lastValueFrom(
            this.httpClient.get<typeof Marketplace.Collection.LoadMy.Response>(
                `${this.ENDPOINT}/my?includeDraftState=${includeDraftState}`
            )
        );

        const typedData =
            Marketplace.Collection.LoadMy.responseSchema.parse(data);

        return typedData.result;
    }

    public async getCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetInviteCode.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/invitecode`)
        );

        const typedData =
            Marketplace.Collection.GetInviteCode.responseSchema.parse(data);

        return typedData.result;
    }

    public async getOrCreateCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.put<
                typeof Marketplace.Collection.PutInviteCode.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/invitecode`, {})
        );

        const typedData =
            Marketplace.Collection.PutInviteCode.responseSchema.parse(data);

        return typedData.result;
    }

    public async getCollectionMembers(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetCollectionMembers.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/members`)
        );

        const typedData =
            Marketplace.Collection.GetCollectionMembers.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async removeCollectionMember(
        collectionEntityId: CollectionEntityId,
        userId: string
    ) {
        await lastValueFrom(
            this.httpClient.delete(
                `${this.ENDPOINT}/${collectionEntityId}/members/`,
                {
                    body: Marketplace.Collection.DeleteCollectionMember.requestSchema.encode(
                        {
                            userId,
                        }
                    ),
                }
            )
        );
    }

    public async setCollectionMemberRole(
        collectionEntityId: CollectionEntityId,
        userId: string,
        role: CollectionRelationshipType
    ) {
        await lastValueFrom(
            this.httpClient.patch(
                `${this.ENDPOINT}/${collectionEntityId}/members/`,
                Marketplace.Collection.PatchCollectionMember.requestSchema.encode(
                    {
                        userId,
                        role,
                    }
                )
            )
        );
    }
}
