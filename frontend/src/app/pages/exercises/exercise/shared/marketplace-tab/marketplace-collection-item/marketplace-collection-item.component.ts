import { Component, inject, input, resource } from '@angular/core';
import {
    checkEditableValueEdited,
    cloneDeepMutable,
    ElementDto,
    gatherCollectionElements,
    uuid,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { selectVehicles } from '../../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../../state/get-state-snapshot';
import {
    InExerciseElement,
    ChangeImpact,
    EditableElementChangeImpact,
    RemovedElementChangeImpact,
} from '../../change-impact-modal/change-impact-types';
import { AppState } from '../../../../../../state/app.state';
import { ChangeImpactModalComponent } from '../../change-impact-modal/change-impact-modal.component';

@Component({
    selector: 'app-marketplace-collection-item-component',
    templateUrl: './marketplace-collection-item.component.html',
    styleUrl: './marketplace-collection-item.component.scss',
    imports: [],
})
export class MarketplaceColletionItemComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly collectionService = inject(CollectionService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModalService = inject(NgbModal);

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
        return gatherCollectionElements(collectionElements).allDirectElements();
    }

    public async removeCollection(collection: VersionedCollectionPartial) {
        const elements =
            await this.collectionService.getElementsOfCollectionVersion(
                collection
            );
        await this.exerciseService.proposeAction({
            type: '[Collection] Remove Collection',
            collectionEntity: collection.entityId,
            elements: gatherCollectionElements(elements).allVisibleElements(),
        });
        // TODO: Keep in mind, that some elements may still be transitive dependencies of other collections!
        // WE SHOULD NOT REMOVE THEM IN THIS CASE!
    }

    public async upgradeCollectionVersion() {
        console.log('UPGRADING');
        // TODO: @Quixelation: Support more than just vehicles
        const allExerciseVehicles = selectStateSnapshot(
            selectVehicles,
            this.store
        );

        const selectedCollection = this.collection();
        if (selectedCollection === null) {
            console.warn(
                'No collection selected, cannot calculate change impacts of upgrading collection version.'
            );
            return;
        }

        const newerCollectionVersionAvailable =
            this.newerVersionAvailable.value();
        if (!newerCollectionVersionAvailable?.newerVersionAvailable) {
            console.warn(
                'No newer collection version available, cannot calculate change impacts of upgrading collection version.'
            );
            return;
        }

        const newerCollection =
            await this.collectionService.getElementsOfCollectionVersion(
                newerCollectionVersionAvailable.latestVersion
            );

        const changeImpacts = await this.calcChangeImpact({
            inExercise: Object.values(allExerciseVehicles),
            new: newerCollection.direct,
            previous: await this.fetchCollectionElements(),
        });
        console.log(
            'Change impacts of upgrading collection version:',
            changeImpacts
        );

        const modal = this.ngbModalService.open(ChangeImpactModalComponent, {
            size: 'xl',
        });
        modal.componentInstance.changes =
            changeImpacts satisfies ChangeImpact[];
        modal.componentInstance.newCollectionElements = newerCollection.direct;
    }

    private async calcChangeImpact(data: {
        previous: ElementDto[];
        inExercise: InExerciseElement[];
        new: ElementDto[];
    }): Promise<ChangeImpact[]> {
        console.log('CALCULATING CHANGE IMPACT');
        console.log(data);

        const {
            addedElements: _addedElements,
            editedNewElements,
            removedElements,
            unchangedElements: _unchangedElements,
        } = await this.checkForChangesBetweenVersions(data.previous, data.new);

        const impacts: ChangeImpact[] = [];

        for (const element of editedNewElements) {
            const inExercise = data.inExercise.find(
                (e) => e.entityId === element.entityId
            );
            if (!inExercise) {
                console.warn(
                    `Element ${element.title ?? element.versionId} has been edited in the marketplace, but is not part of the exercise. No change impact calculation possible.`,
                    element
                );
                continue;
            }

            const editedValues = checkEditableValueEdited({
                template: element.content,
                element: cloneDeepMutable(inExercise),
            });

            if (editedValues.length > 0) {
                impacts.push({
                    id: uuid(),
                    type: 'updated',
                    element: inExercise,
                    entity: element,
                    editedValues,
                } satisfies EditableElementChangeImpact);
            }
        }

        for (const element of removedElements) {
            const inExercise = data.inExercise.find(
                (e) => e.entityId === element.entityId
            );
            if (!inExercise) {
                console.warn(
                    `Element ${element.title ?? element.versionId} has been edited in the marketplace, but is not part of the exercise. No change impact calculation possible.`,
                    element
                );
                continue;
            }
            const matchingElement = data.previous.find(
                (e) => e.entityId === element.entityId
            );
            if (!matchingElement) {
                console.warn(
                    `Element with entityId ${element.entityId} has been removed in the marketplace, but was not part of the previous collection version. No change impact calculation possible.`
                );
                continue;
            }

            impacts.push({
                id: uuid(),
                type: 'removed',
                element: inExercise,
                entity: matchingElement,
            } satisfies RemovedElementChangeImpact);
        }

        return impacts;
    }

    private async checkForChangesBetweenVersions(
        currentState: ElementDto[],
        newerVersion: ElementDto[]
    ) {
        const addedElements = [];
        const editedNewElements = [];
        const removedElements = [];
        const unchangedElements = [];

        for (const element of newerVersion) {
            const matchingElement = currentState.find(
                (e) => e.entityId === element.entityId
            );

            if (!matchingElement) {
                addedElements.push(element);
                continue;
            }

            if (element.version !== matchingElement.version) {
                editedNewElements.push(element);
            }

            unchangedElements.push(element);
        }

        for (const element of currentState) {
            const matchingElement = newerVersion.find(
                (e) => e.entityId === element.entityId
            );

            if (!matchingElement) {
                removedElements.push(element);
            }
        }

        return {
            addedElements,
            editedNewElements,
            removedElements,
            unchangedElements,
        };
    }
}
