import { Component, inject, input, resource } from '@angular/core';
import {
    ElementDto,
    gatherCollectionElements,
    VersionedCollectionPartial,
    getCollectionElementDiff,
    CollectionElementsDto,
    calculateChangeImpacts,
    CollectionDto,
    cloneDeepMutable,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Immutable, WritableDraft } from 'immer';
import { CollectionService } from '../../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    selectExerciseState,
    selectSelectedCollections,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { AppState } from '../../../../../../state/app.state';
import { LoadingModalService } from '../../../../../../core/loading-modal/loading-modal.service';
import { openChangeImpactModal } from '../../change-impact-modal/open-change-impact-modal';
import { ConfirmationModalService } from '../../../../../../core/confirmation-modal/confirmation-modal.service';

@Component({
    selector: 'app-exercise-collection-item-component',
    templateUrl: './exercise-collection-item.component.html',
    styleUrl: './exercise-collection-item.component.scss',
    imports: [],
})
export class ExerciseColletionItemComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly collectionService = inject(CollectionService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModalService = inject(NgbModal);
    private readonly loadingModalService = inject(LoadingModalService);
    private readonly confirmationModal = inject(ConfirmationModalService);

    public readonly collection = input.required<VersionedCollectionPartial>();

    public readonly collectionData = resource({
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

    private async fetchCollectionElements(): Promise<Immutable<ElementDto[]>> {
        const collectionElements =
            await this.collectionService.getElementsOfCollectionVersion(
                this.collection()
            );
        return gatherCollectionElements(
            collectionElements
        ).allVisibleElements();
    }

    public async removeCollection(collection: CollectionDto) {
        try {
            this.loadingModalService.showLoading({
                title: 'Neue Version wird geladen',
                description:
                    'Bitte warten Sie, während die neue Version der Sammlung geladen wird und die Auswirkungen von Änderungen berechnet werden.',
            });

            const currentSelectedCollections = selectStateSnapshot(
                selectSelectedCollections,
                this.store
            );

            const filteredCollections = currentSelectedCollections.filter(
                (c) => c.entityId !== this.collection().entityId
            );

            const currentElements = await this.getAllCollectionElements(
                currentSelectedCollections
            );
            const newElements =
                await this.getAllCollectionElements(filteredCollections);

            const elementsChanges = getCollectionElementDiff(
                gatherCollectionElements(currentElements).allVisibleElements(),
                gatherCollectionElements(newElements).allVisibleElements()
            );

            const currentState = selectStateSnapshot(
                selectExerciseState,
                this.store
            );

            const changeImpacts = calculateChangeImpacts(
                currentState,
                elementsChanges
            );

            const newTemplates =
                await this.getAllCollectionElements(filteredCollections);

            this.loadingModalService.closeLoading();

            const result = await openChangeImpactModal(this.ngbModalService, {
                changeImpacts,
                visibleAvailableElements:
                    gatherCollectionElements(newTemplates).allVisibleElements(),
            });

            if (!result.apply) return;
            if (result.confirmationSuggested) {
                const confirmationResult = await this.confirmationModal.confirm(
                    {
                        title: 'Sammlung entfernen',
                        description: `Die Sammlung "${collection.title}" wird aus der Übung entfernt. Es werden auch alle Elemente entfernt, die nur über diese Sammlung verfügbar sind. Möchten Sie die Sammlung trotzdem entfernen?`,
                        confirmationButtonText: 'Sammlung entfernen',
                    }
                );
                if (!confirmationResult) return;
            }

            this.exerciseService.proposeAction({
                type: '[Collection] Remove Collection',
                changeApplies: result.changes,
                collectionVersion: this.collection(),
                overwriteTemplates: newTemplates,
            });
        } catch (error) {
            this.loadingModalService.closeLoading();
            throw error;
        }
    }

    public buildElementTree() {
        return [];
    }

    public async upgradeCollectionVersion(collection: CollectionDto) {
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

            const currentState = selectStateSnapshot(
                selectExerciseState,
                this.store
            );

            const currentSelectedCollections = selectStateSnapshot(
                selectSelectedCollections,
                this.store
            );

            const currentCollectionElements =
                await this.fetchCollectionElements();

            const changes = getCollectionElementDiff(
                currentCollectionElements,
                gatherCollectionElements(
                    newerCollectionElements
                ).allVisibleElements()
            );

            const newTemplates = await this.getAllCollectionElements(
                currentSelectedCollections.map((c) => {
                    if (c.entityId === selectedCollection.entityId) {
                        return newerCollectionVersionAvailable.latestVersion;
                    }
                    return c;
                })
            );

            const changeImpacts = calculateChangeImpacts(currentState, changes);

            console.log({ changes, changeImpacts });

            this.loadingModalService.closeLoading();

            const result = await openChangeImpactModal(this.ngbModalService, {
                changeImpacts,
                visibleAvailableElements:
                    gatherCollectionElements(newTemplates).allVisibleElements(),
            });

            if (!result.apply) return;
            if (result.confirmationSuggested) {
                const confirmationResult = await this.confirmationModal.confirm(
                    {
                        title: 'Sammlung entfernen',
                        description: `Die Sammlung "${collection.title}" wird auf die neueste Version aktualisiert. Es gibt keine direkten Änderungen an Elementen auf der Karte, aber es können sich Änderungen in den zur Verfügung stehenden Vorlagen ergeben.`,
                        confirmationButtonText: 'Sammlung aktualisieren',
                    }
                );
                if (!confirmationResult) return;
            }

            this.exerciseService.proposeAction({
                type: '[Collection] Upgrade Collection',
                changeApplies: result.changes,
                collectionVersion:
                    newerCollectionVersionAvailable.latestVersion,
                overwriteTemplates: newTemplates,
            });
        } catch (error) {
            this.loadingModalService.closeLoading();
            throw error;
        }
    }

    private async getAllCollectionElements(
        collections: VersionedCollectionPartial[]
    ): Promise<CollectionElementsDto> {
        const elements = await Promise.all(
            collections.map(async (collection) =>
                this.collectionService.getElementsOfCollectionVersion(
                    collection
                )
            )
        );
        return cloneDeepMutable(elements).reduce<
            WritableDraft<CollectionElementsDto>
        >(
            (acc, collectionElements) => {
                acc.direct.push(...collectionElements.direct);

                for (const elementType of ['references', 'imported'] as const) {
                    for (const colElements of collectionElements[elementType]) {
                        const existingCollection = acc[elementType].find(
                            (f) =>
                                f.collection.entityId ===
                                colElements.collection.entityId
                        );
                        if (existingCollection) {
                            existingCollection.elements.push(
                                ...colElements.elements
                            );
                        } else {
                            acc[elementType].push({
                                collection: colElements.collection,
                                elements: [...colElements.elements],
                            });
                        }
                    }
                }
                return acc;
            },
            { direct: [], imported: [], references: [] }
        );
    }
}
