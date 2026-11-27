import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
    ClientToServerEvents,
    CollectionVersion,
    CollectionEntityId,
    CollectionVersionId,
    ElementEntityId,
    ElementVersionId,
    Marketplace,
    ServerToClientEvents,
    socketIoTransports,
    VersionedCollectionPartial,
    VersionedElementPartial,
    cloneDeepMutable,
    CollectionElements,
    CollectionMembershipRole,
    OrganisationId,
    CollectionVersionStructureWithMetadata,
    collectionEntityIdSchema,
    collectionVersionIdSchema,
    UploadedImageUploadInput,
    UploadedImage,
} from 'fuesim-digital-shared';
import { BehaviorSubject, lastValueFrom, map } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Immutable } from 'immer';
import { Router } from '@angular/router';
import { preventStatusErrorToastContext } from '../shared/functions/http';
import { httpOrigin, websocketOrigin } from './api-origins';
import { MessageService } from './messages/message.service';
import { openConnectionLostModal } from './connection-lost-modal/open-connection-lost-modal';
import { LoadingModalService } from './loading-modal/loading-modal.service';
import { PromptModalService } from './prompt-modal/prompt-modal.service';

export interface CollectionSubscriptionData {
    collection: CollectionVersion;
    objects: CollectionElements;
    publishedCollection: CollectionVersion;
    publishedElements: CollectionElements;
    ownRole: CollectionMembershipRole;
}

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private readonly router = inject(Router);
    private readonly httpClient = inject(HttpClient);
    private readonly messageService = inject(MessageService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly loadingModalService = inject(LoadingModalService);
    private readonly promptService = inject(PromptModalService);

    private readonly socket: Socket<
        ServerToClientEvents,
        ClientToServerEvents
    > = io(websocketOrigin, {
        ...socketIoTransports,
    });

    public readonly ENDPOINT = `${httpOrigin}/api/collections`;
    private readonly _collectionSubscriptions = new Map<
        CollectionEntityId,
        BehaviorSubject<CollectionSubscriptionData | null>
    >();

    /**
     * Indicates whether the socket connection should fail hard with a modal in case of any disconnect.
     *
     * This is set to true, as soon as any request to the server has been made, where a response is expected.
     * Not logged in users WILL get disconnected. We dont wanna show a modat there.
     */
    private socketFailHard = false;

    constructor() {
        this.socket.emit('registerCollectionListenerClient', (response) => {
            if (response.success) return;
            this.socketErrorHandler(
                `Failed to init collection listener${response.message}`
            );
        });
        this.socket.on('collectionUpdate', (update) => {
            const changeEvent =
                Marketplace.Collection.Events.SSEvent.schema.decode(update);
            this.handleCollectionUpdateEvent(changeEvent);
        });
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io client disconnect') {
                return;
            }
            this.socketErrorHandler(reason);
        });
    }

    static getUploadedImageUrl(
        uploadedImageId: ElementVersionId | UploadedImage['id'],
        uploadedImage: UploadedImage
    ) {
        return `${httpOrigin}/api/collections/image/${uploadedImageId}?secret=${uploadedImage.secret}`;
    }

    private socketErrorHandler(error: any) {
        if (!this.socketFailHard) {
            console.warn(
                'Socket connection issue for collection service; the user is probably just not logged in.',
                error
            );
            return;
        }
        console.error(error);
        openConnectionLostModal(this.ngbModalService);
    }

    private handleCollectionUpdateEvent(
        changeEvent: typeof Marketplace.Collection.Events.SSEvent.Type
    ) {
        const subject = this._collectionSubscriptions.get(
            changeEvent.collectionEntityId
        );
        if (!subject) {
            console.warn(
                `Received collection update for collection ${changeEvent.collectionEntityId} but no subscription found.`
            );
            return;
        }

        switch (changeEvent.event) {
            case 'initialdata': {
                // will be handled differently
                break;
            }
            case 'element:create': {
                const currentValue = subject.getValue();
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
                subject.next(cloneDeepMutable(newValue));
                break;
            }
            case 'element:update': {
                const currentValue = subject.getValue();
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
                subject.next(cloneDeepMutable(newValue));
                break;
            }

            case 'element:delete': {
                const currentValue = subject.getValue();
                if (!currentValue) return;
                const newValue = {
                    ...currentValue,
                    objects: {
                        ...currentValue.objects,
                        direct: currentValue.objects.direct.filter(
                            (object) =>
                                object.entityId !== changeEvent.data.entityId
                        ),
                    },
                };
                subject.next(newValue);
                break;
            }

            case 'dependency:change': {
                // THIS EVENT DOES NOT NEED TO BE HANDLED BY FRONTEND
                // dependency:replace-data is the important event here
                break;
            }

            case 'dependency:replace-data': {
                const currentValue = subject.getValue();
                if (!currentValue) return;
                const newValue = {
                    ...currentValue,
                    objects: {
                        direct: currentValue.objects.direct,
                        imported: cloneDeepMutable(changeEvent.data.imported),
                        references: cloneDeepMutable(
                            changeEvent.data.references
                        ),
                    },
                } satisfies CollectionSubscriptionData;
                subject.next(cloneDeepMutable(newValue));
                break;
            }

            case 'collection:update': {
                const currentValue = subject.getValue();
                if (!currentValue) return;
                const newValue = {
                    ...currentValue,
                    collection: changeEvent.data,
                };
                subject.next(newValue);
                break;
            }
            case 'collection:refresh-data': {
                const currentValue = subject.getValue();
                if (!currentValue) return;
                const newValue = {
                    ...currentValue,
                    publishedElements:
                        changeEvent.data.publishedElements ??
                        currentValue.publishedElements,
                    objects:
                        changeEvent.data.draftElements ?? currentValue.objects,
                    collection:
                        changeEvent.data.draftCollection ??
                        currentValue.collection,
                    publishedCollection:
                        changeEvent.data.publishedCollection ??
                        currentValue.publishedCollection,
                } satisfies Immutable<CollectionSubscriptionData>;
                subject.next(cloneDeepMutable(newValue));
                break;
            }
            default: {
                console.warn(`Unhandled event type`, changeEvent);
            }
        }
    }

    public async subscribeToCollection(
        collectionEntityId: CollectionEntityId
    ): Promise<BehaviorSubject<CollectionSubscriptionData | null>> {
        const subject = new BehaviorSubject<CollectionSubscriptionData | null>(
            null
        );
        this._collectionSubscriptions.set(collectionEntityId, subject);

        while (!this.socket.connected) {
            this.loadingModalService.showLoading({
                title: 'Elemente werden geladen',
                description: 'Verbindung zum Server wird hergestellt…',
            });
            // eslint-disable-next-line no-await-in-loop
            await new Promise((resolve) => {
                setTimeout(resolve, 250);
            });
        }
        this.loadingModalService.closeLoading();

        this.socket.emit(
            'joinCollectionRoom',
            collectionEntityId,
            (response) => {
                this.socketFailHard = true;
                if (!response.success) return;
                const initialData =
                    Marketplace.Collection.Events.InitialData.schema.decode(
                        cloneDeepMutable(response.payload)
                    );

                subject.next({
                    collection: initialData.data.collection,
                    objects: initialData.data.elements,
                    publishedCollection: initialData.data.publishedCollection,
                    publishedElements: initialData.data.publishedElements,
                    ownRole: initialData.data.userRelationship,
                });
            }
        );

        this._collectionSubscriptions.get(collectionEntityId)?.subscribe({
            complete: () => {
                this.socket.emit(
                    'leaveCollectionRoom',
                    collectionEntityId,
                    () => {
                        /* nop */
                    }
                );
                this._collectionSubscriptions.delete(collectionEntityId);
            },
        });

        return subject;
    }

    public async getLatestCollectionVersionByEntityId(
        entityId: CollectionEntityId,
        opts: { allowDraftState: boolean }
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetByEntityId.Response
            >(
                `${this.ENDPOINT}/${entityId}?allowdraftstate=${opts.allowDraftState}`,
                {
                    context: preventStatusErrorToastContext(),
                }
            )
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

    public async getLatestElementsByCollectionId(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetLatestElementsBySetVersionId.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/latest`)
        );

        return data;
    }

    public async deleteElement(
        elementEntityId: ElementEntityId,
        collectionEntityId: CollectionEntityId,
        acceptedCascadingDeletions: ElementVersionId[] = []
    ) {
        const result = await lastValueFrom(
            this.httpClient.delete<typeof Marketplace.Element.Delete.Response>(
                `${this.ENDPOINT}/${collectionEntityId}/element/${elementEntityId}`,
                {
                    body: Marketplace.Element.Delete.requestSchema.encode({
                        conflictResolution: {
                            acceptedCascadingDeletions,
                        },
                    }),
                }
            )
        );

        if (result.requiresConfirmation.length === 0) {
            this.messageService.postMessage({
                title: 'Element gelöscht',
                body: 'Das Element wurde erfolgreich gelöscht.',
                color: 'success',
            });
        }

        return result;
    }

    public async restoreDeletedElement(
        collectionEntityId: CollectionEntityId,
        elementEntityId: ElementEntityId,
        elementVersionId: ElementVersionId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Restore.Response>(
                `${this.ENDPOINT}/${collectionEntityId}/element/${elementEntityId}/version/${elementVersionId}/restore`,
                {}
            )
        );

        const parsedData =
            Marketplace.Element.Restore.responseSchema.parse(data);

        this.messageService.postMessage({
            title: 'Element wiederhergestellt',
            body: 'Das Element wurde erfolgreich wiederhergestellt.',
            color: 'success',
        });

        return parsedData.result;
    }

    public async createColletion(
        title: string,
        organisationId: OrganisationId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Collection.Create.Response>(
                `${this.ENDPOINT}/create`,
                {
                    title,
                    organisationId,
                } satisfies typeof Marketplace.Collection.Create.Request
            )
        );

        const parsedData =
            Marketplace.Collection.Create.responseSchema.parse(data);

        return parsedData.result;
    }

    public async createElement(
        collectionEntityId: CollectionEntityId,
        content: object
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Create.Response>(
                `${this.ENDPOINT}/${collectionEntityId}/create`,
                Marketplace.Element.Create.requestSchema.parse({
                    data: [content],
                })
            )
        );

        return data.result;
    }

    public async uploadImage(
        collectionEntityId: CollectionEntityId,
        data: UploadedImageUploadInput
    ) {
        const result = await lastValueFrom(
            this.httpClient
                .post(
                    `${this.ENDPOINT}/${collectionEntityId}/upload`,
                    Marketplace.Element.UploadImage.requestSchema.encode({
                        data,
                    })
                )
                .pipe(
                    map((v) =>
                        Marketplace.Element.UploadImage.responseSchema.parse(v)
                    )
                )
        );

        return result.result;
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
        collectionEntityId: CollectionEntityId,
        conflictResolution?: Marketplace.Element.EditConflictResolution
    ) {
        const data = await lastValueFrom(
            this.httpClient.put<typeof Marketplace.Element.Edit.Response>(
                `${this.ENDPOINT}/${collectionEntityId}/element/${entityId}`,
                Marketplace.Element.Edit.requestSchema.parse({
                    data: content,
                    conflictResolution,
                })
            )
        );

        this.messageService.postMessage({
            title: 'Element aktualisiert',
            body: 'Das Element wurde erfolgreich aktualisiert.',
            color: 'success',
        });

        return data.result;
    }

    public async makeCollectionPublic(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.ChangeVisibility.Response
            >(
                `${this.ENDPOINT}/${collectionEntityId}/change-visibility`,
                Marketplace.Collection.ChangeVisibility.requestSchema.parse({
                    visibility: 'public',
                })
            )
        );

        const parsedData =
            Marketplace.Collection.ChangeVisibility.responseSchema.parse(data);

        return parsedData;
    }

    public async duplicateCollection(
        setVersionId: CollectionEntityId,
        specificCollectionVersionId: CollectionVersionId,
        title: string,
        targetOrganisationId: OrganisationId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.Duplicate.Response
            >(
                `${this.ENDPOINT}/${setVersionId}/version/${specificCollectionVersionId}/duplicate`,
                Marketplace.Collection.Duplicate.requestSchema.parse({
                    title,
                    targetOrganisationId,
                })
            )
        );

        const parsedData =
            Marketplace.Collection.Duplicate.responseSchema.parse(data);

        this.messageService.postMessage({
            title: 'Sammlung dupliziert',
            body: 'Die Sammlung wurde erfolgreich dupliziert.',
            color: 'success',
        });

        return parsedData.createdCollection;
    }
    public async archiveCollection(collectionEntityId: CollectionEntityId) {
        await lastValueFrom(
            this.httpClient.post(
                `${this.ENDPOINT}/${collectionEntityId}/archive`,
                {}
            )
        );

        this.messageService.postMessage({
            title: 'Sammlung archiviert',
            body: 'Die Sammlung wurde archiviert und ist nicht mehr in Ihrer Sammlungsliste sichtbar.',
            color: 'success',
        });
    }

    public async unarchiveCollection(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post(
                `${this.ENDPOINT}/${collectionEntityId}/unarchive`,
                {}
            )
        );

        this.messageService.postMessage({
            title: 'Sammlung wiederhergestellt',
            body: 'Die Sammlung wurde wiederhergestellt und ist nun in Ihrer Sammlungsliste sichtbar.',
            color: 'success',
        });

        return data;
    }

    public async addCollectionDependency(opts: {
        importTo: CollectionEntityId;
        importFrom: CollectionVersionId;
    }) {
        await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.AddDependency.Response
            >(
                `${this.ENDPOINT}/${opts.importTo}/dependencies/${opts.importFrom}`,
                {}
            )
        );
    }

    public async upgradeCollectionDependency(opts: {
        importTo: CollectionEntityId;
        importFrom: CollectionVersionId;
        acceptedElementChanges: ElementVersionId[];
    }) {
        await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.UpgradeDependency.Response
            >(
                `${this.ENDPOINT}/${opts.importTo}/dependencies/${opts.importFrom}/upgrade`,
                Marketplace.Collection.UpgradeDependency.requestSchema.encode({
                    acceptedElementChanges: opts.acceptedElementChanges,
                })
            )
        );
    }

    public async removeCollectionDependency(opts: {
        removeFrom: CollectionEntityId;
        removeVersionId: CollectionVersionId;
    }) {
        const data = await lastValueFrom(
            this.httpClient.delete<
                typeof Marketplace.Collection.RemoveDependency.Response
            >(
                `${this.ENDPOINT}/${opts.removeFrom}/dependencies/${opts.removeVersionId}`
            )
        );

        const typedData =
            Marketplace.Collection.RemoveDependency.responseSchema.parse(data);

        if (typedData.result.blockingElements.length > 0) {
            this.messageService.postError({
                title: 'Sammlung kann nicht entfernt werden',
                body: `Die Sammlung kann nicht entfernt werden, da folgende Elemente davon abhängen: ${typedData.result.blockingElements.map((e) => e.title).join(', ')}.`,
            });
            return;
        }

        this.messageService.postMessage({
            title: 'Sammlung entfernt',
            body: 'Die Sammlung wurde erfolgreich entfernt.',
            color: 'success',
        });

        return typedData.result;
    }

    public async getCollectionDependencies(
        collection: VersionedCollectionPartial
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetCollectionDependencies.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}/dependencies`
            )
        );

        const typedData =
            Marketplace.Collection.GetCollectionDependencies.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async saveDraftState(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.SaveDraftState.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/draft`, {})
        );

        const parsedData =
            Marketplace.Collection.SaveDraftState.responseSchema.parse(data);

        if (!parsedData.saved || parsedData.result === null) {
            this.messageService.postError({
                title: 'Sammlung konnte nicht gespeichert werden',
                body: 'Probieren Sie es erneut oder laden Sie die Seite neu.',
            });
        } else {
            this.messageService.postMessage({
                title: 'Sammlung gespeichert',
                body: 'Eine neue Version wurde erfolgreich gespeichert.',
                color: 'success',
            });
        }
    }

    public async revertDraftState(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.delete<
                typeof Marketplace.Collection.SaveDraftState.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/draft`, {})
        );

        const parsedData =
            Marketplace.Collection.DeleteDraftState.responseSchema.parse(data);

        if (!parsedData.reverted || parsedData.result === null) {
            this.messageService.postError({
                title: 'Sammlung konnte nicht zurückgesetzt werden',
                body: 'Probieren Sie es erneut oder laden Sie die Seite neu.',
            });
        }
    }

    public async getElementsOfCollectionVersion(
        collection: VersionedCollectionPartial
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetElementsOfCollectionVersion.Response
            >(
                `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}/elements`,
                {
                    context: preventStatusErrorToastContext(),
                }
            )
        );

        const typedData =
            Marketplace.Collection.GetElementsOfCollectionVersion.responseSchema.parse(
                data
            );

        return typedData;
    }

    public async getCollectionVersion(
        collection: VersionedCollectionPartial
    ): Promise<
        | (typeof Marketplace.Collection.GetCollectionVersion.Response)['result']
        | null
    > {
        try {
            const data = await lastValueFrom(
                this.httpClient.get<
                    typeof Marketplace.Collection.GetCollectionVersion.Response
                >(
                    `${this.ENDPOINT}/${collection.entityId}/version/${collection.versionId}`,
                    {
                        context: preventStatusErrorToastContext(),
                    }
                )
            );

            const typedData =
                Marketplace.Collection.GetCollectionVersion.responseSchema.parse(
                    data
                );

            return typedData.result;
        } catch (error) {
            if (error instanceof HttpErrorResponse && error.status === 404) {
                return null;
            }
            throw error;
        }
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
                collection.entityId,
                { allowDraftState: false }
            );
        const currentCollection = await this.getCollectionVersion(collection);

        if (currentCollection === null) {
            return { newerVersionAvailable: false };
        }

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
        originCollectionEntity: CollectionEntityId;
        element: VersionedElementPartial;
        targetCollectionEntity?: CollectionEntityId;
    }) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Duplicate.Response>(
                `${this.ENDPOINT}/${opts.originCollectionEntity}/element/${opts.element.entityId}/version/${opts.element.versionId}/duplicate`,
                Marketplace.Element.Duplicate.requestSchema.encode({
                    externalCollection: opts.targetCollectionEntity,
                })
            )
        );

        const typedData =
            Marketplace.Element.Duplicate.responseSchema.parse(data);

        this.messageService.postMessage({
            title: 'Element dupliziert',
            body: 'Das Element wurde erfolgreich dupliziert und zur Sammlung hinzugefügt.',
            color: 'success',
            button: {
                name: 'Sammlung öffnen',
                color: 'primary',
                action: () => {
                    this.router.navigate([
                        '/collections',
                        opts.targetCollectionEntity,
                    ]);
                },
            },
        });

        return typedData.result;
    }

    public async getMyCollections(opts?: {
        includeDraftState?: boolean;
        archived?: boolean;
    }) {
        const data = await lastValueFrom(
            this.httpClient.get<typeof Marketplace.Collection.LoadMy.Response>(
                `${this.ENDPOINT}/my?includeDraftState=${opts?.includeDraftState ?? true}&archived=${opts?.archived ?? false}`
            )
        );

        const typedData =
            Marketplace.Collection.LoadMy.responseSchema.parse(data);

        return typedData.result;
    }

    public async getPublicCollections() {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.LoadPublic.Response
            >(`${this.ENDPOINT}/public`)
        );

        const typedData =
            Marketplace.Collection.LoadPublic.responseSchema.parse(data);

        return typedData.result;
    }

    public async getUsableCollections() {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.LoadUsable.Response
            >(`${this.ENDPOINT}/usable`)
        );

        const typedData =
            Marketplace.Collection.LoadUsable.responseSchema.parse(data);

        return typedData.result;
    }

    public async getCollectionsForOrganisation(organisationId: OrganisationId) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.LoadForOrganisation.Response
            >(`${this.ENDPOINT}/org/${organisationId}`)
        );

        const typedData =
            Marketplace.Collection.LoadForOrganisation.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async getUserRoleInCollection(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetCollectionUserRole.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/user-role`)
        );

        const typedData =
            Marketplace.Collection.GetCollectionUserRole.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async addOrganisationToCollection(
        organisationId: OrganisationId,
        collectionEntityId: CollectionEntityId
    ) {
        try {
            await lastValueFrom(
                this.httpClient.post(
                    `${this.ENDPOINT}/${collectionEntityId}/members`,
                    Marketplace.Collection.AddCollectionOrganisation.requestSchema.encode(
                        {
                            organisationId,
                        }
                    ),
                    {
                        context: preventStatusErrorToastContext(),
                    }
                )
            );

            this.messageService.postMessage({
                title: 'Organisation hinzugefügt',
                body: 'Die Organisation wurde erfolgreich zur Sammlung hinzugefügt.',
                color: 'success',
            });
        } catch {
            this.messageService.postError({
                title: 'Fehler beim Hinzufügen der Organisation',
                body: 'Die Organisation konnte nicht zur Sammlung hinzugefügt werden. Bitte versuchen Sie es erneut.',
            });
        }
    }

    public async setOrganisationCollectionOwner(
        organisationId: OrganisationId,
        collectionEntityId: CollectionEntityId
    ) {
        try {
            await lastValueFrom(
                this.httpClient.put(
                    `${this.ENDPOINT}/${collectionEntityId}/members`,
                    Marketplace.Collection.SetCollectionOrganisationOwner.requestSchema.encode(
                        {
                            organisationId,
                        }
                    ),
                    {
                        context: preventStatusErrorToastContext(),
                    }
                )
            );

            this.messageService.postMessage({
                title: 'Besitzer geändert',
                body: 'Die Organisation wurde erfolgreich als neuer Besitzer der Sammlung festgelegt.',
                color: 'success',
            });
        } catch {
            this.messageService.postError({
                title: 'Fehler beim Ändern des Besitzers',
                body: 'Die Organisation konnte nicht als neuer Besitzer der Sammlung festgelegt werden. Bitte versuchen Sie es erneut.',
            });
        }
    }

    public async revokeCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        await lastValueFrom(
            this.httpClient.delete(
                `${this.ENDPOINT}/${collectionEntityId}/invitecode`
            )
        );

        this.messageService.postMessage({
            title: 'Einladungscode widerrufen',
            body: 'Der Einladungscode wurde widerrufen und ist nun ungültig.',
            color: 'success',
        });
    }

    public async createCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.PutInviteCode.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/invitecode`, {})
        );

        const typedData =
            Marketplace.Collection.PutInviteCode.responseSchema.parse(data);

        this.messageService.postMessage({
            title: 'Einladungslink erstellt',
            body: 'Alle Nutzer mit diesem Link können der Sammlung beitreten. Teilen Sie den Link mit den Personen, die Zugriff auf die Sammlung haben sollen.',
            color: 'success',
        });

        return typedData.result;
    }

    public async getJoinCodePreview(joinCode: string) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetPreviewByJoinCode.Response
            >(`${this.ENDPOINT}/join/${joinCode}/preview`)
        );

        const typedData =
            Marketplace.Collection.GetPreviewByJoinCode.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async joinCollectionByJoinCode(
        joinCode: string,
        organisationId: OrganisationId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.JoinByJoinCode.Response
            >(
                `${this.ENDPOINT}/join`,
                Marketplace.Collection.JoinByJoinCode.requestSchema.encode({
                    organisationId,
                    joinCode,
                })
            )
        );

        const typedData =
            Marketplace.Collection.JoinByJoinCode.responseSchema.parse(data);

        if (typedData.result) {
            this.messageService.postMessage({
                title: 'Erfolgreich beigetreten',
                body: 'Sie sind der Sammlung erfolgreich beigetreten und können nun die Inhalte sehen und bearbeiten.',
                color: 'success',
            });
        }

        this.router.navigate(['/collections', typedData.result]);

        return typedData.result;
    }

    public async getCollectionMembers(collectionEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetCollectionOrganisations.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/members`)
        );

        const typedData =
            Marketplace.Collection.GetCollectionOrganisations.responseSchema.parse(
                data
            );

        return typedData.result;
    }

    public async removeCollectionMember(
        collectionEntityId: CollectionEntityId,
        organisationId: OrganisationId
    ) {
        await lastValueFrom(
            this.httpClient.delete(
                `${this.ENDPOINT}/${collectionEntityId}/members/`,
                {
                    body: Marketplace.Collection.RemoveCollectionOrganisation.requestSchema.encode(
                        {
                            organisationId,
                        }
                    ),
                }
            )
        );
    }

    public async leaveCollection(collectionEntityId: CollectionEntityId) {
        await lastValueFrom(
            this.httpClient.post(
                `${this.ENDPOINT}/${collectionEntityId}/members/leave`,
                {}
            )
        );

        this.messageService.postMessage({
            title: 'Sammlung verlassen',
            body: 'Sie haben die Sammlung verlassen und können nun nicht mehr auf die Inhalte zugreifen.',
            color: 'success',
        });
    }

    // Collection Structure ----------

    private readonly collectionVersionStructureCache = new Map<
        CollectionVersionId,
        CollectionVersionStructureWithMetadata
    >();

    public async getCollectionVersionStructure(
        collectionEntityId: CollectionEntityId,
        collectionVersionId: CollectionVersionId
    ) {
        if (this.collectionVersionStructureCache.has(collectionVersionId)) {
            return this.collectionVersionStructureCache.get(
                collectionVersionId
            )!;
        }

        let structure: CollectionVersionStructureWithMetadata;

        try {
            const data = await lastValueFrom(
                this.httpClient.get<
                    typeof Marketplace.Collection.GetElementStructureOfCollectionVersion.Response
                >(
                    `${this.ENDPOINT}/${collectionEntityId}/version/${collectionVersionId}/structure`,
                    {
                        context: preventStatusErrorToastContext(),
                    }
                )
            );

            structure =
                Marketplace.Collection.GetElementStructureOfCollectionVersion.responseSchema.parse(
                    data
                ).result;
        } catch (error) {
            console.error(error);
            structure = {
                direct: [],
                imported: [],
                references: [],
                title: 'Unbekannte Sammlung',
                version: 1,
            };
        }

        this.collectionVersionStructureCache.set(
            collectionVersionId,
            structure
        );

        return structure;
    }

    /**
     * This should be fine to use, since the cache is only filled on init of the main exercise component.
     * JUST DO NOT USE THIS OUTSIDE OF AN EXERCISE CONTEXT, since the cache may not be filled otherwise.
     */
    public getCollectionVersionStructureFromCache(
        collectionVersionId: CollectionVersionId
    ) {
        if (!this.collectionVersionStructureCache.has(collectionVersionId)) {
            throw new Error(
                `Collection version structure for version ${collectionVersionId} not found in cache. This should only be used in an exercise context where the cache is filled on init.`
            );
        }
        return this.collectionVersionStructureCache.get(collectionVersionId)!;
    }

    public readonly catchAllCollection: VersionedCollectionPartial = {
        entityId: collectionEntityIdSchema.parse(
            'collection_entity_b6e46e26-612b-47f7-bc93-419a9587c914'
        ),
        versionId: collectionVersionIdSchema.parse(
            'collection_version_df5263d7-8cf8-4755-87a2-57367c83d99c'
        ),
    };
}
