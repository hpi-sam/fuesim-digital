import { Component, inject, input, resource } from '@angular/core';
import {
    ElementDto,
    gatherCollectionElements,
    VersionedCollectionPartial,
    ChangeImpact,
    getCollectionElementDiff,
    getAllMarketplaceRegistryEntries,
    CollectionElementsDto,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import {
    selectExerciseState,
    selectSelectedCollections,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import { AppState } from '../../../../../../state/app.state';
import { ChangeImpactModalComponent } from '../../change-impact-modal/change-impact-modal.component';
import { LoadingModalService } from '../../../../../../core/loading-modal/loading-modal.service';

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

    private async fetchCollectionElements(): Promise<ElementDto[]> {
        const collectionElements =
            await this.collectionService.getElementsOfCollectionVersion(
                this.collection()
            );
        return gatherCollectionElements(
            collectionElements
        ).allVisibleElements();
    }

    public async removeCollection(collection: VersionedCollectionPartial) {
        /*        try {
            this.loadingModalService.showLoading({
                title: 'Neue Version wird geladen',
                description:
                    'Bitte warten Sie, während die neue Version der Sammlung geladen wird und die Auswirkungen von Änderungen berechnet werden.',
            });

            const elements =
                await this.collectionService.getElementsOfCollectionVersion(
                    collection
                );

            const elementsInExercise = getAllMarketplaceStateElements(
                selectStateSnapshot(selectExerciseState, this.store)
            );

            const changeImpacts = await this.calcChangeImpact({
                inExercise: elementsInExercise,
                new: [],
                previous: gatherCollectionElements(elements).allDirectElements(),
            });

            this.loadingModalService.closeLoading();

            const modal = this.ngbModalService.open(ChangeImpactModalComponent, {
                size: 'xl',
            });
            modal.componentInstance.changes = changeImpacts satisfies ChangeImpact[];
            modal.componentInstance.newCollectionElements = elements.direct;
        } catch (error) {
            this.loadingModalService.closeLoading();
            throw error;
        }*/
        /* await this.exerciseService.proposeAction({
            type: '[Collection] Remove Collection',
            collectionEntity: collection.entityId,
            elements: gatherCollectionElements(elements).allVisibleElements(),
        });*/
        // TODO: Keep in mind, that some elements may still be transitive dependencies of other collections!
        // WE SHOULD NOT REMOVE THEM IN THIS CASE!
    }

    public buildElementTree() {
        return [];
    }

    public async upgradeCollectionVersion() {
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

            const currentCollectionElements =
                await this.fetchCollectionElements();

            const changes = getCollectionElementDiff(
                currentCollectionElements,
                gatherCollectionElements(
                    newerCollectionElements
                ).allVisibleElements()
            );

            const registryEntries = getAllMarketplaceRegistryEntries();
            const changeImpacts: ChangeImpact[] = [];

            for (const [type, entry] of Object.entries(registryEntries)) {
                console.log(
                    'Calculating change impacts for registry entry',
                    type
                );
                for (const change of changes) {
                    changeImpacts.push(
                        ...entry.changeImpact(currentState, change)
                    );
                }
            }

            console.log({ changes, changeImpacts });

            this.loadingModalService.closeLoading();

            const modal = this.ngbModalService.open(
                ChangeImpactModalComponent,
                {
                    size: 'xl',
                }
            );
            const componentInstance =
                modal.componentInstance as ChangeImpactModalComponent;
            console.log('Calculated change impacts:', changeImpacts);
            componentInstance.changes = changeImpacts satisfies ChangeImpact[];
            componentInstance.newCollectionElements = gatherCollectionElements(
                newerCollectionElements
            ).allVisibleElements();

            const result = await firstValueFrom(
                componentInstance.submitChanges
            );

            if (!result.apply) return;
            const currentSelectedCollections = selectStateSnapshot(
                selectSelectedCollections,
                this.store
            );

            this.exerciseService.proposeAction({
                type: '[Collection] Upgrade Collection',
                changeApplies: result.changes,
                collectionVersion:
                    newerCollectionVersionAvailable.latestVersion,
                overwriteTemplates: await this.getAllCollectionElements(
                    currentSelectedCollections.map((c) => {
                        if (c.entityId === selectedCollection.entityId) {
                            return newerCollectionVersionAvailable.latestVersion;
                        }
                        return c;
                    })
                ),
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
        return elements.reduce<CollectionElementsDto>(
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
