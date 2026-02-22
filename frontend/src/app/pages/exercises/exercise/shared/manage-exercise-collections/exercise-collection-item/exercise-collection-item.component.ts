import { Component, inject, input, resource } from '@angular/core';
import {
    TemplateVersion,
    CollectionVersion,
    getAllCollectionElements,
    gatherAllVisibleCollectionElements,
    cloneDeepMutable,
    ExerciseKey,
    CollectionStateReference,
    CollectionElements,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Immutable } from 'immer';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CollectionService } from '../../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { selectSelectedCollections } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { AppState } from '../../../../../../state/app.state';
import { LoadingModalService } from '../../../../../../core/loading-modal/loading-modal.service';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';
import { MessageService } from '../../../../../../core/messages/message.service';
import { selectTemplatesFromCollectionEntity } from '../../../../../../state/application/selectors/marketplace.selectors';
import { openMarketplaceCollectionUpdateImpactModal } from '../../../../../marketplace/shared/modals/marketplace-collection-update-impact-modal/open-marketplace-collection-update-impact-modal';

@Component({
    selector: 'app-exercise-collection-item-component',
    templateUrl: './exercise-collection-item.component.html',
    styleUrl: './exercise-collection-item.component.scss',
    imports: [RouterLink, DatePipe],
})
export class ExerciseColletionItemComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly collectionService = inject(CollectionService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModalService = inject(NgbModal);
    private readonly messageService = inject(MessageService);
    private readonly loadingModalService = inject(LoadingModalService);
    private readonly confirmationModal = inject(ConfirmationModalService);

    public readonly exerciseKey = input.required<ExerciseKey>();
    public readonly collection = input.required<CollectionStateReference>();

    public readonly collectionDataRes = resource({
        params: () => ({
            collection: this.collection(),
        }),
        loader: async ({ params: { collection } }) =>
            this.collectionService.getCollectionVersion(collection),
    });

    public readonly newerVersionAvailable = resource({
        params: () => ({
            collection: this.collection(),
        }),
        loader: async ({ params: { collection } }) =>
            this.collectionService.checkNewerVersionAvailable(collection),
    });

    private async fetchCollectionElements(): Promise<
        Immutable<TemplateVersion[]>
    > {
        const collectionElements =
            await this.collectionService.getElementsOfCollectionVersion(
                this.collection()
            );
        return gatherAllVisibleCollectionElements(collectionElements);
    }

    public async removeCollection() {
        try {
            const currentSelectedCollections = selectStateSnapshot(
                selectSelectedCollections,
                this.store
            );

            const filteredCollections = currentSelectedCollections.filter(
                (c) => c.entityId !== this.collection().entityId
            );

            const newFilteredElementsList: CollectionElements =
                await getAllCollectionElements(filteredCollections, async (c) =>
                    selectStateSnapshot(
                        selectTemplatesFromCollectionEntity(c.entityId),
                        this.store
                    )
                );

            const confirmationResult = await this.confirmationModal.confirm({
                title: 'Sammlung entfernen',
                description: `Die Sammlung wird aus der Übung entfernt. Damit haben Sie keinen Zugriff mehr auf die Elemente dieser Sammlung. Bereits in der Übung verwendete Elemente bleiben jedoch erhalten. Möchten Sie die Sammlung wirklich entfernen?`,
                confirmationButtonText: 'Sammlung entfernen',
            });
            if (!confirmationResult) return;

            this.exerciseService.proposeAction({
                type: '[Collection] Remove Collection',
                changeApplies: [],
                collectionVersion: this.collection(),
                overwriteTemplates: newFilteredElementsList,
            });
        } catch (error) {
            this.messageService.postError({
                title: 'Fehler beim Entfernen der Sammlung',
                body: 'Die Sammlung konnte nicht entfernt werden.',
                error,
            });
            throw error;
        }
    }

    public async upgradeCollectionVersion(collection: CollectionVersion) {
        try {
            this.loadingModalService.showLoading({
                title: 'Neue Version wird geladen',
                description:
                    'Bitte warten Sie, während die neue Version der Sammlung geladen wird und die Auswirkungen von Änderungen berechnet werden.',
            });

            const selectedCollection = this.collection();

            const newerCollectionVersionAvailable =
                await this.collectionService.checkNewerVersionAvailable(
                    selectedCollection
                );
            if (!newerCollectionVersionAvailable.newerVersionAvailable) {
                return;
            }

            const newerCollectionElements =
                await this.collectionService.getElementsOfCollectionVersion(
                    newerCollectionVersionAvailable.latestVersion
                );

            const currentSelectedCollections = selectStateSnapshot(
                selectSelectedCollections,
                this.store
            );

            const currentCollectionElements =
                await this.fetchCollectionElements();

            const newCollectionData =
                await this.collectionService.getCollectionVersion(
                    newerCollectionVersionAvailable.latestVersion
                );
            if (newCollectionData === null) {
                this.messageService.postError({
                    title: 'Fehler beim Laden der neuen Version',
                    body: 'Die neue Version der Sammlung konnte nicht geladen werden.',
                });
                this.loadingModalService.closeLoading();
                return;
            }

            const newTemplates = await getAllCollectionElements(
                currentSelectedCollections.map((c) => {
                    if (c.entityId === selectedCollection.entityId) {
                        return newerCollectionVersionAvailable.latestVersion;
                    }
                    return c;
                }),
                async (c) =>
                    this.collectionService.getElementsOfCollectionVersion(c)
            );

            this.loadingModalService.closeLoading();

            const result = await openMarketplaceCollectionUpdateImpactModal(
                this.ngbModalService,
                {
                    oldCollectionElements: cloneDeepMutable(
                        currentCollectionElements
                    ),
                    newCollectionElements: gatherAllVisibleCollectionElements(
                        newerCollectionElements
                    ),
                }
            );

            if (!result) return;

            const confirmationResult = await this.confirmationModal.confirm({
                title: 'Sammlung aktualisieren',
                description: `Die Sammlung "${collection.title}" wird auf die neueste Version aktualisiert. Die Änderungen werden NICHT automatisch auf die Elemente auf der Karte übernommen. Sie müssen diese Elemente MANUELL aktualisieren.`,
                confirmationString: 'MANUELL',
                confirmationButtonText: 'Sammlung aktualisieren',
            });
            if (!confirmationResult) return;

            this.exerciseService.proposeAction({
                type: '[Collection] Upgrade Collection',
                collection: newCollectionData,
                collectionElements: newerCollectionElements,
                changeApplies: [],
                overwriteTemplates: newTemplates,
            });
        } catch (error) {
            this.loadingModalService.closeLoading();
            this.messageService.postError({
                title: 'Fehler beim Aktualisieren der Sammlung',
                body: 'Die Sammlung konnte nicht aktualisiert werden.',
                error,
            });
            throw error;
        }
    }

    public closeActiveModal() {
        this.ngbModalService.dismissAll();
    }
}
