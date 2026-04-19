import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
    CollectionDto,
    CollectionElementsDto,
    CollectionEntityId,
    CollectionRelationshipType,
    CollectionVersionId,
    ElementEntityId,
    ElementVersionId,
    Marketplace,
    VersionedCollectionPartial,
    versionedElementContentSchema,
    VersionedElementPartial,
} from 'fuesim-digital-shared';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';

export interface CollectionSubscriptionData {
    collection: CollectionDto;
    objects: CollectionElementsDto,
    ownRole: CollectionRelationshipType;
}

@Injectable({
    providedIn: 'root',
})
export class CollectionService {
    private readonly httpClient = inject(HttpClient);
    private readonly messageService = inject(MessageService);

    public readonly ENDPOINT = `${httpOrigin}/api/collections`;
    private readonly _collectionSubscriptions = new Map<
        CollectionEntityId,
        BehaviorSubject<CollectionSubscriptionData | null>
    >();

    public subscribeToCollection(
        setEntityId: CollectionEntityId
    ): BehaviorSubject<CollectionSubscriptionData | null> {
        const collectionEventSource = new EventSource(
            `${this.ENDPOINT}/${setEntityId}/events`,
            { withCredentials: true }
        );

        const subject = new BehaviorSubject<CollectionSubscriptionData | null>(
            null
        );
        this._collectionSubscriptions.set(setEntityId, subject);
        collectionEventSource.addEventListener('change', (event) => {
            const changeEvent =
                Marketplace.Collection.Events.SSEvent.schema.parse(
                    JSON.parse(event.data)
                );

            switch (changeEvent.event) {
                case 'initialdata': {
                    subject.next({
                        collection: changeEvent.data.collection,
                        objects: changeEvent.data.elements,
                        ownRole: changeEvent.data.userRelationship,
                    });
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
                    subject.next(newValue);
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
                    subject.next(newValue);
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
                                    object.entityId !==
                                    changeEvent.data.entityId
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
                            imported: changeEvent.data.imported,
                            references: changeEvent.data.references
                        },
                    } satisfies CollectionSubscriptionData;
                    subject.next(newValue);
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

        this._collectionSubscriptions.get(setEntityId)?.subscribe({
            complete: () => {
                collectionEventSource.close();
                this._collectionSubscriptions.delete(setEntityId);
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
                `${this.ENDPOINT}/${entityId}?allowdraftstate=` +
                    opts.allowDraftState
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
        collectionId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetLatestElementsBySetVersionId.Response
            >(`${this.ENDPOINT}/${collectionId}/latest`)
        );

        return data;
    }

    public async deleteElement(
        elementEntityId: ElementEntityId,
        setEntityId: CollectionEntityId,
        acceptedCascadingDeletions: ElementVersionId[] = []
    ) {
        const result = await lastValueFrom(
            this.httpClient.delete<typeof Marketplace.Element.Delete.Response>(
                `${this.ENDPOINT}/${setEntityId}/element/${elementEntityId}`,
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

    public async createColletion(title: string) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Collection.Create.Response>(
                `${this.ENDPOINT}/create`,
                {
                    title,
                } satisfies typeof Marketplace.Collection.Create.Request
            )
        );

        const parsedData =
            Marketplace.Collection.Create.responseSchema.parse(data);

        return parsedData.result;
    }

    public async createElement(
        setEntityId: CollectionEntityId,
        content: object
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Create.Response>(
                `${this.ENDPOINT}/${setEntityId}/create`,
                Marketplace.Element.Create.requestSchema.parse({
                    data: [content],
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

        this.messageService.postMessage({
            title: 'Element aktualisiert',
            body: 'Das Element wurde erfolgreich aktualisiert.',
            color: 'success',
        });

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

        const parsedData =
            Marketplace.Collection.ChangeVisibility.responseSchema.parse(data);

        return parsedData;
    }

    public async duplicateCollection(
        setVersionId: CollectionEntityId,
        specificCollectionVersionId: CollectionVersionId
    ) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.Duplicate.Response
            >(
                `${this.ENDPOINT}/${setVersionId}/version/${specificCollectionVersionId}/duplicate`,
                {}
            )
        );

        const parsedData =
            Marketplace.Collection.Duplicate.responseSchema.parse(data);

        return parsedData.createdSet;
    }
    public async archiveCollection(setEntityId: CollectionEntityId) {
        await lastValueFrom(
            this.httpClient.post(`${this.ENDPOINT}/${setEntityId}/archive`, {})
        );

        this.messageService.postMessage({
            title: 'Sammlung archiviert',
            body: 'Die Sammlung wurde archiviert und ist nicht mehr in Ihrer Sammlungsliste sichtbar.',
            color: 'success',
        });
    }

    public async unarchiveCollection(setEntityId: CollectionEntityId) {
        const data = await lastValueFrom(
            this.httpClient.post(
                `${this.ENDPOINT}/${setEntityId}/unarchive`,
                {}
            )
        );

        this.messageService.postMessage({
            title: 'Sammlung wiederhergestellt',
            body: 'Die Sammlung wurde wiederhergestellt und ist nun in Ihrer Sammlungsliste sichtbar.',
            color: 'success',
        });
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

    public async getCollectionVersion(collection: VersionedCollectionPartial) {
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
                collection.entityId,
                { allowDraftState: false }
            );
        const currentCollection = await this.getCollectionVersion(collection);

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

        this.messageService.postMessage({
            title: 'Element dupliziert',
            body: 'Das Element wurde erfolgreich dupliziert und zur Sammlung hinzugefügt.',
            color: 'success',
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

    public async revokeCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        await lastValueFrom(
            this.httpClient.delete(
                `${this.ENDPOINT}/${collectionEntityId}/invitecode`
            )
        );

        this.messageService.postMessage({
            title: 'Einladungslink widerrufen',
            body: 'Der Einladungslink wurde widerrufen und ist nun ungültig.',
            color: 'success',
        });
    }

    public async createCollectionInviteCode(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.put<
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

    public async joinCollectionByJoinCode(joinCode: string) {
        const data = await lastValueFrom(
            this.httpClient.post<
                typeof Marketplace.Collection.JoinByJoinCode.Response
            >(`${this.ENDPOINT}/join/${joinCode}`, {})
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

        return typedData.result;
    }

    public async checkIsCollectionMember(
        collectionEntityId: CollectionEntityId
    ) {
        const data = await lastValueFrom(
            this.httpClient.get<
                typeof Marketplace.Collection.GetIsMember.Response
            >(`${this.ENDPOINT}/${collectionEntityId}/isMember`)
        );

        const typedData =
            Marketplace.Collection.GetIsMember.responseSchema.parse(data);

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

    public async importElements(
        collectionEntityId: CollectionEntityId,
        elements: { type: string }[]
    ) {
        const nonParsedElements: { type: string }[] = [];
        for (const element of elements) {
            const result = versionedElementContentSchema.safeParse(element);
            if (!result.success) {
                nonParsedElements.push(element);
            }
        }

        this.messageService.postMessage({
            title: 'Nicht unterstützte Elemente',
            body: `Es werden ${nonParsedElements.length} von ${elements.length} Elementen übersprungen.`,
            color: 'info',
        });

        const data = await lastValueFrom(
            this.httpClient.post<typeof Marketplace.Element.Import.Response>(
                `${this.ENDPOINT}/${collectionEntityId}/import`,
                Marketplace.Element.Import.requestSchema.parse({
                    elements: elements.filter((element) =>
                        nonParsedElements.some(
                            (nonParsed) => nonParsed === element
                        )
                    ),
                })
            )
        );

        const typedData = Marketplace.Element.Import.responseSchema.parse(data);

        this.messageService.postMessage({
            title: 'Import abgeschlossen',
            body: `Es wurden ${typedData.result.length} Elemente erfolgreich importiert.`,
            color: 'success',
        });

        return typedData.result;
    }
}
