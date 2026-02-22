import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
    CollectionDto,
    CollectionEntityId,
    CollectionVersionId,
    ElementEntityId,
    Marketplace,
    VersionedCollectionPartial,
    VersionedElementPartial,
} from 'fuesim-digital-shared';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

export type ExerciseElementSetSubscriptionData = {
    collection: CollectionDto;
    objects: typeof Marketplace.Set.GetLatestElementsBySetVersionId.Response;
};

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private readonly httpClient = inject(HttpClient);
    private readonly messageService = inject(MessageService);

    public readonly ENDPOINT = httpOrigin + '/api/collections';
    private _elementSets = signal<CollectionDto[]>([]);
    private _elementSetSubscriptions = new Map<
        CollectionEntityId,
        BehaviorSubject<ExerciseElementSetSubscriptionData | null>
    >();

    public get elementSets() {
        return this._elementSets.asReadonly();
    }

    public subscribeToCollection(
        setEntityId: CollectionEntityId,
        callback: (data: ExerciseElementSetSubscriptionData) => void
    ): () => void {
        let collectionEventSource = new EventSource(
            `${this.ENDPOINT}/${setEntityId}/events`,
            { withCredentials: true }
        );

        this._elementSetSubscriptions.set(
            setEntityId,
            new BehaviorSubject<ExerciseElementSetSubscriptionData | null>(null)
        );
        collectionEventSource.addEventListener('change', (event) => {
            console.log(
                `Received change event for setEntityId ${setEntityId}:`,
                event
            );
            const changeEvent = Marketplace.Set.Events.Event.schema.parse(
                JSON.parse(event.data)
            );

            switch (changeEvent.event) {
                case 'initialdata': {
                    this._elementSetSubscriptions.get(setEntityId)?.next({
                        collection: changeEvent.data.collection,
                        objects: changeEvent.data.elements,
                    });
                    break;
                }
                case 'element:create': {
                    const currentValue = this._elementSetSubscriptions
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
                    this._elementSetSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }
                case 'element:update': {
                    const currentValue = this._elementSetSubscriptions
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
                    this._elementSetSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }

                case 'element:delete': {
                    const currentValue = this._elementSetSubscriptions
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
                    this._elementSetSubscriptions
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
                    const currentValue = this._elementSetSubscriptions
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
                    this._elementSetSubscriptions
                        .get(setEntityId)
                        ?.next(newValue);
                    break;
                }

                case 'collection:update': {
                    this._elementSets.update((val) =>
                        val.map((m) =>
                            m.entityId === setEntityId
                                ? {
                                      ...m,
                                      title: changeEvent.data.title,
                                      description: changeEvent.data.description,
                                  }
                                : m
                        )
                    );

                    const currentValue = this._elementSetSubscriptions
                        .get(setEntityId)
                        ?.getValue();
                    if (!currentValue) return;
                    const newValue = {
                        ...currentValue,
                        collection: changeEvent.data,
                    };
                    this._elementSetSubscriptions
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
        const firstValue = this._elementSetSubscriptions
            .get(setEntityId)
            ?.getValue();
        if (firstValue) {
            callback(firstValue);
        }
        this._elementSetSubscriptions.get(setEntityId)!.subscribe((data) => {
            console.log(
                `Subscription for setVersionId ${setEntityId} received update:`,
                data
            );
            if (!data) return;
            callback(data);
        });

        return () => {
            collectionEventSource.close();
            this._elementSetSubscriptions.get(setEntityId)?.complete();
            this._elementSetSubscriptions.delete(setEntityId);
            console.log(`Closing ${setEntityId}`);
        };
    }

    public async loadCollections() {
        const data = await lastValueFrom(
            this.httpClient.get<typeof Marketplace.Set.LoadMy.Response>(
                `${this.ENDPOINT}/my`
            )
        );

        this._elementSets.set(data.result);
    }

    public async getLatestCollectionVersionByEntityId(
        entityId: CollectionEntityId
    ) {
        console.log(
            'Fetching latest collection version for entityId',
            entityId
        );
        const data = await lastValueFrom(
            this.httpClient.get<typeof Marketplace.Set.GetByEntityId.Response>(
                `${this.ENDPOINT}/${entityId}`
            )
        );

        return data.result;
    }

    public async updateCollectionData(
        collectionEntityId: CollectionEntityId,
        data: Marketplace.Set.EditableCollectionProperties
    ) {
        const response = await lastValueFrom(
            this.httpClient.patch<typeof Marketplace.Set.Edit.Response>(
                `${this.ENDPOINT}/${collectionEntityId}`,
                Marketplace.Set.Edit.requestSchema.parse(data)
            )
        );

        const parsedData = Marketplace.Set.Edit.responseSchema.parse(response);

        if (parsedData.result) {
            this.messageService.postMessage({
                color: 'success',
                title: 'Sammlung aktualisiert',
                body: 'Die Sammlungsdaten wurden erfolgreich aktualisiert.',
            });
        }
    }

    public async getLatestElementsByCollectionId(setId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Set.GetLatestElementsBySetVersionId.Response
            >(`${this.ENDPOINT}/${setId}/latest`)
        );

        console.log('Received latest element set objects:', data);

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
        //TODO: Make this interface nicer / with confirm button
        if (result.requiresConfirmation.length > 0) {
            this.messageService.postError({
                title: 'Entfernen nicht möglich',
                body: `Zu löschendes Element muss zuerst aus folgenden anderen Elementen entfernt werden: ${result.requiresConfirmation.map((e) => e.element.title).join(', ')}.`,
            });
        }
    }

    public async createColletion(title: string) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Set.Create.Response>(
                `${this.ENDPOINT}/create`,
                {
                    title,
                } satisfies typeof Marketplace.Set.Create.Request
            )
        );

        this._elementSets.update((elementSets) => [
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
        setEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.put<typeof Marketplace.Element.Edit.Response>(
                `${this.ENDPOINT}/${setEntityId}/element/${entityId}`,
                Marketplace.Element.Edit.requestSchema.parse({
                    data: content,
                })
            )
        );

        return data.result;
    }

    public async makeCollectionPublic(setEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Set.ChangeVisibility.Response
            >(
                `${this.ENDPOINT}/${setEntityId}/change-visibility`,
                Marketplace.Set.ChangeVisibility.requestSchema.parse({
                    visibility: 'public',
                })
            )
        );

        if (data.status === 'success') {
            this._elementSets.update((elementSets) =>
                elementSets.map((set) =>
                    set.entityId === setEntityId
                        ? { ...set, visibility: 'public' }
                        : set
                )
            );
        }
    }

    public async duplicateCollection(
        setVersionId: CollectionEntityId,
        specificSetVersionId: CollectionVersionId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Set.Duplicate.Response>(
                `${this.ENDPOINT}/${setVersionId}/version/${specificSetVersionId}/duplicate`,
                {}
            )
        );

        const parsedData = Marketplace.Set.Duplicate.responseSchema.parse(data);

        this._elementSets.update((elementSets) => [
            ...elementSets,
            parsedData.createdSet,
        ]);
    }
    public async deleteCollection(setEntityId: CollectionEntityId) {
        await lastValueFrom(
            this.httpClient.delete(`${this.ENDPOINT}/${setEntityId}/entity`)
        );

        this._elementSets.update((val) =>
            val.filter((f) => f.entityId !== setEntityId)
        );
    }

    public async addCollectionDependency(opts: {
        importTo: CollectionEntityId;
        importFrom: CollectionVersionId;
    }) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Set.Import.Response>(
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
                typeof Marketplace.Set.SaveDraftState.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/save`, {})
        );

        const parsedData =
            Marketplace.Set.SaveDraftState.responseSchema.parse(data);

        if (parsedData.saved === false || parsedData.result === null) {
            this.messageService.postError({
                title: 'Sammlung konnte nicht gespeichert werden',
                body: 'Probieren Sie es erneut oder laden Sie die Seite neu.',
            });
            return;
        }

        this._elementSets.update((elementSets) =>
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
                typeof Marketplace.Set.GetElementsOfCollectionVersion.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}/elements`
            )
        );

        const typedData =
            Marketplace.Set.GetElementsOfCollectionVersion.responseSchema.parse(
                data
            );

        return typedData;
    }

    public async getCollectionByVersionId(
        collection: VersionedCollectionPartial
    ) {
        console.log('getCollectionByVersionId', collection);
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Set.GetCollectionVersion.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}`
            )
        );

        const typedData =
            Marketplace.Set.GetCollectionVersion.responseSchema.parse(data);

        return typedData.result;
    }

    public async checkNewerVersionAvailable(
        collection: VersionedCollectionPartial
    ): Promise<
        | { newerVersionAvailable: false }
        | {
              newerVersionAvailable: true;
              latestVersion: VersionedCollectionPartial;
          }
    > {
        console.log('f', collection);
        const latestCollection =
            await this.getLatestCollectionVersionByEntityId(
                collection.entityId
            );
        console.log('f', latestCollection);
        const currentCollection =
            await this.getCollectionByVersionId(collection);

        if (latestCollection.version < currentCollection.version) {
            console.error(
                `Current collection version ${collection.versionId} is newer than latest collection version ${latestCollection.versionId}`
            );
        }

        if (latestCollection.version === currentCollection.version) {
            return { newerVersionAvailable: false };
        } else {
            return {
                newerVersionAvailable: true,
                latestVersion: {
                    versionId: latestCollection.versionId,
                    entityId: latestCollection.entityId,
                },
            };
        }
    }

    async duplicateElement(opts: {
        collectionEntity: CollectionEntityId,
        element: VersionedElementPartial
    }){
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Duplicate.Response>(
                `${this.ENDPOINT}/${opts.collectionEntity}/element/${opts.element.entityId}/version/${opts.element.versionId}/duplicate`,
                {}
            )
        );

        const typedData = Marketplace.Element.Duplicate.responseSchema.parse(data);

        return typedData.result;
    }

    public async getMyCollections(includeDraftState: boolean = true) {
        const data = await lastValueFrom(
            this.httpClient.get<typeof Marketplace.Set.LoadMy.Response>(
                `${this.ENDPOINT}/my?includeDraftState=${includeDraftState}`
            )
        );

        const typedData = Marketplace.Set.LoadMy.responseSchema.parse(data);

        return typedData.result;
    }
}
