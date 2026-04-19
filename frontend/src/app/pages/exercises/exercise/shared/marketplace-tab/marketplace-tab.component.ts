import { Component, inject, signal } from '@angular/core';
import {
    CollectionDto,
    ElementDto,
    gatherCollectionElements,
    uuid,
    Vehicle,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DragElementService } from '../core/drag-element.service';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { AppState } from '../../../../../state/app.state';
import {
    selectSelectedCollections,
    selectVehicles,
} from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';
import {
    ChangeImpact,
    EditableElementChangeImpact,
    InExerciseElement,
} from '../change-impact-modal/change-impact-types';
import { MarketplaceColletionItemComponent } from './marketplace-collection-item/marketplace-collection-item.component';
import { openSelectCollectionModal } from './marketplace-select-collection-modal/select-collection-modal';

@Component({
    selector: 'app-marketplace-tab',
    imports: [
        MapEditorCardComponent,
        NgbDropdownModule,
        MarketplaceColletionItemComponent,
    ],
    templateUrl: './marketplace-tab.component.html',
    styleUrl: './marketplace-tab.component.scss',
})
export class MarketplaceTabComponent {
    public readonly dragElementService = inject(DragElementService);
    private readonly collectionService = inject(CollectionService);
    private readonly exerciseService = inject(ExerciseService);
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModalService = inject(NgbModal);
    public readonly availableCollections = signal<CollectionDto[]>([]);
    public readonly updateAvailable = signal<Awaited<
        ReturnType<typeof this.collectionService.checkNewerVersionAvailable>
    > | null>(null);

    public selectedCollections = this.store.selectSignal(
        selectSelectedCollections
    );

    public async openCollectionSelectDialog() {
        const result = await openSelectCollectionModal(this.ngbModalService, {
            showDependencyElements: true,
            disallowedCollections: this.selectedCollections().map(
                (e) => e.entityId
            ),
        });
        if (result === null) return;

        const elements =
            await this.collectionService.getElementsOfCollectionVersion(result);
        await this.exerciseService.proposeAction({
            type: '[Collection] Add Collection',
            elements: gatherCollectionElements(elements).allVisibleElements(),
            collectionVersion: {
                versionId: result.versionId,
                entityId: result.entityId,
            },
        });
    }

    public async upgradeCollectionVersion() {
        // TODO: @Quixelation: Support more than just vehicles
        const allExerciseVehicles = selectStateSnapshot(
            selectVehicles,
            this.store
        );

        const selectedCollection = this.selectedCollections();
        if (selectedCollection === null) {
            console.warn(
                'No collection selected, cannot calculate change impacts of upgrading collection version.'
            );
            return;
        }

        const newerCollectionVersionAvailable = this.updateAvailable();
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

        /*const changeImpacts = await this.calcChangeImpact({
            inExercise: Object.values(allExerciseVehicles),
            new: newerCollection.direct,
            // TODO: this is not always correct - actually fetch the data here
            previous: this.elementsOfSelectedCollection(),
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
        */
    }

    private async calcChangeImpact(data: {
        previous: ElementDto[];
        inExercise: InExerciseElement[];
        new: ElementDto[];
    }): Promise<ChangeImpact[]> {
        const {
            addedElements: _addedElements,
            editedNewElements,
            removedElements,
            unchangedElements: _unchangedElements,
        } = await this.checkForChangesBetweenVersions(data.previous, data.new);

        const impacts: ChangeImpact[] = [];

        for (const element of editedNewElements) {
            const inExercise = data.inExercise.find(
                (e) => e.versionId === element.versionId
            );
            if (!inExercise) {
                console.warn(
                    `Element with versionId ${element.versionId} has been edited in the marketplace, but is not part of the exercise. No change impact calculation possible.`
                );
                continue;
            }

            switch (element.content.type) {
                case 'vehicleTemplate':
                    impacts.push(
                        ...this.vehicleChangeImpact({
                            previous: data.previous.find(
                                (e) => e.versionId === element.versionId
                            )!,
                            inExercise,
                            new: element,
                        })
                    );
                    break;
                default:
                    console.warn(
                        `No change impact calculation implemented for element type ${element.content.type}`
                    );
            }
        }

        for (const element of removedElements) {
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
                element: data.inExercise.find(
                    (e) => e.entityId === element.entityId
                )!,
                entity: matchingElement,
            });
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

    private vehicleChangeImpact(data: {
        previous: ElementDto;
        inExercise: Vehicle;
        new: ElementDto;
    }): EditableElementChangeImpact[] {
        // EDITABLE FIELDS: name
        const impacts: EditableElementChangeImpact[] = [];

        if (data.inExercise.name !== data.previous.content.name) {
            // data has been manually edited by user
            // needs to be merged manually, otherwise user changes would be lost
            return [
                {
                    id: uuid(),
                    type: 'editable',
                    element: data.inExercise,
                    oldValue: data.previous.content.name,
                    currentValue: data.inExercise.name,
                    newValue: data.new.content.name,
                },
            ];
        }

        return impacts;
    }
}
