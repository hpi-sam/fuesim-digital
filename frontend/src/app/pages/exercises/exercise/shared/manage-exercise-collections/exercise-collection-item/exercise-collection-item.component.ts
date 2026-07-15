import { Component, inject, input, resource } from '@angular/core';
import {
    TemplateVersion,
    VersionedCollectionPartial,
    getCollectionElementDiff,
    CollectionVersion,
    ChangeImpact,
    ExerciseState,
    marketplaceElementsDefinitions,
    ChangeApply,
    getAllCollectionElements,
    ChangedTemplateVersion,
    gatherAllVisibleCollectionElements,
    cloneDeepMutable,
    ExerciseKey,
    ElementVersionId,
    getElementDependencies,
    ChangeDependencies,
    CollectionStateReference,
    CollectionElements,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Immutable } from 'immer';
import { RouterLink } from '@angular/router';
import { DatePipe, JsonPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
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
import { CollectionUpgradeImpactModalComponent } from '../../../../../marketplace/shared/modals/marketplace-collection-update-impact-modal/marketplace-collection-update-impact-modal.component';
import { MessageService } from '../../../../../../core/messages/message.service';
import { selectTemplatesFromCollectionEntity } from '../../../../../../state/application/selectors/marketplace.selectors';

@Component({
    selector: 'app-exercise-collection-item-component',
    templateUrl: './exercise-collection-item.component.html',
    styleUrl: './exercise-collection-item.component.scss',
    imports: [RouterLink, DatePipe, JsonPipe],
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

    public async removeCollection(collection: VersionedCollectionPartial) {
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

            const currentElements = await getAllCollectionElements(
                cloneDeepMutable(currentSelectedCollections),
                async (c) =>
                    selectStateSnapshot(
                        selectTemplatesFromCollectionEntity(c.entityId),
                        this.store
                    )
            );

            const newFilteredElementsList: CollectionElements =
                await getAllCollectionElements(filteredCollections, async (c) =>
                    selectStateSnapshot(
                        selectTemplatesFromCollectionEntity(c.entityId),
                        this.store
                    )
                );

            const elementsChanges = getCollectionElementDiff(
                gatherAllVisibleCollectionElements(currentElements),
                gatherAllVisibleCollectionElements(newFilteredElementsList)
            );

            const currentState = selectStateSnapshot(
                selectExerciseState,
                this.store
            );

            const changeImpacts = this.calculateChangeImpacts(
                currentState,
                elementsChanges
            );

            this.loadingModalService.closeLoading();

            const result = await openChangeImpactModal(this.ngbModalService, {
                changeImpacts: changeImpacts.impact,
                visibleAvailableElements: gatherAllVisibleCollectionElements(
                    newFilteredElementsList
                ),
            });

            if (!result.apply) return;
            if (result.confirmationSuggested) {
                const confirmationResult = await this.confirmationModal.confirm(
                    {
                        title: 'Sammlung entfernen',
                        description: `Die Sammlung wird aus der Übung entfernt. Es werden auch alle Elemente entfernt, die nur über diese Sammlung verfügbar sind. Möchten Sie die Sammlung trotzdem entfernen?`,
                        confirmationButtonText: 'Sammlung entfernen',
                    }
                );
                if (!confirmationResult) return;
            }

            this.exerciseService.proposeAction({
                type: '[Collection] Remove Collection',
                changeApplies: [...result.changes, ...changeImpacts.apply],
                collectionVersion: this.collection(),
                overwriteTemplates: newFilteredElementsList,
            });
        } catch (error) {
            this.loadingModalService.closeLoading();
            throw error;
        }
    }

    public buildElementTree() {
        return [];
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
                gatherAllVisibleCollectionElements(newerCollectionElements)
            );

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

            const changeImpacts = this.calculateChangeImpacts(
                currentState,
                changes
            );

            this.loadingModalService.closeLoading();

            const currentCollectionDependencies: {
                element: TemplateVersion;
                dependsOn: ElementVersionId[];
            }[] = [];
            for (const currentElement of currentCollectionElements) {
                currentCollectionDependencies.push({
                    element: currentElement,
                    dependsOn: getElementDependencies(currentElement.content),
                });
            }

            // Calculate which elements of the current collection depend
            // on changed elements of the dependency, to be able to
            // show the impact of the update
            const changeDependencies: ChangeDependencies = {};
            for (const change of changes) {
                if (change.type === 'create') continue;
                const elementId = change.old.versionId;
                if (!elementId) continue;

                const dependingElements = currentCollectionDependencies
                    .filter((dep) => dep.dependsOn.includes(elementId))
                    .map((dep) => dep.element);
                changeDependencies[elementId] = dependingElements;
            }

            this.loadingModalService.closeLoading();
            const modal = this.ngbModalService.open(
                CollectionUpgradeImpactModalComponent,
                {
                    size: 'xl',
                }
            );

            const modalInstance =
                modal.componentInstance as CollectionUpgradeImpactModalComponent;
            modalInstance.changes = changes;
            modalInstance.collectionElements =
                gatherAllVisibleCollectionElements(newerCollectionElements);
            modalInstance.changeDependencies = changeDependencies;
            modalInstance.confirmationButtonText =
                'Änderungen annehmen und Sammlung aktualisieren';

            const result1 = await firstValueFrom(
                modalInstance.confirmationResult$
            );
            if (!result1) return;

            const result = await openChangeImpactModal(this.ngbModalService, {
                changeImpacts: changeImpacts.impact,
                visibleAvailableElements:
                    gatherAllVisibleCollectionElements(newTemplates),
            });

            if (!result.apply) return;
            if (result.confirmationSuggested) {
                const confirmationResult = await this.confirmationModal.confirm(
                    {
                        title: 'Sammlung aktualisieren',
                        description: `Die Sammlung "${collection.title}" wird auf die neueste Version aktualisiert. Es gibt keine direkten Änderungen an Elementen auf der Karte, aber es können sich Änderungen in den zur Verfügung stehenden Vorlagen ergeben.`,
                        confirmationButtonText: 'Sammlung aktualisieren',
                    }
                );
                if (!confirmationResult) return;
            }

            this.exerciseService.proposeAction({
                type: '[Collection] Upgrade Collection',
                collection,
                collectionElements: newerCollectionElements,
                changeApplies: [...result.changes, ...changeImpacts.apply],
                overwriteTemplates: newTemplates,
            });
        } catch (error) {
            this.loadingModalService.closeLoading();
            throw error;
        }
    }

    private calculateChangeImpacts(
        currentState: ExerciseState,
        changes: ChangedTemplateVersion[]
    ): { impact: ChangeImpact[]; apply: ChangeApply[] } {
        const changeImpacts: ChangeImpact[] = [];
        const changeApplies: ChangeApply[] = [];

        for (const element of Object.values(marketplaceElementsDefinitions)) {
            for (const change of changes) {
                const result = element.changeImpact(currentState, change);
                changeImpacts.push(...result.impact);
                changeApplies.push(...result.apply);
            }
        }
        return { impact: changeImpacts, apply: changeApplies };
    }

    public closeActiveModal() {
        this.ngbModalService.dismissAll();
    }
}
