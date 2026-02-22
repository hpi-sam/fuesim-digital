import { Component, effect, inject, signal } from '@angular/core';
import {
    CollectionDto,
    ElementDto,
    Marketplace,
    uuid,
    Vehicle,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { DragElementService } from '../core/drag-element.service';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../state/app.state';
import {
    selectSelectedCollection,
    selectVehicles,
} from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChangeImpactModalComponent } from '../change-impact-modal/change-impact-modal.component';
import { MapEditorCardComponent } from '../../../../../shared/components/map-editor-card/map-editor-card.component';

@Component({
    selector: 'app-marketplace-tab',
    imports: [MapEditorCardComponent],
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

    constructor() {
        this.collectionService.getMyCollections(false).then((collections) => {
            this.availableCollections.set(collections);
        });
        effect(() => {
            const selectedCollection = this.selectedCollection();
            if (selectedCollection) {
                this.updateCollectionElementSubscription(selectedCollection);
                this.collectionService
                    .getCollectionByVersionId(selectedCollection)
                    .then((collection) => {
                        this.selectedCollectionData.set(collection);
                    });
            }
        });
    }

    public selectedCollection = this.store.selectSignal(
        selectSelectedCollection
    );
    public selectedCollectionData = signal<CollectionDto | null>(null);
    public elementsOfSelectedCollection = signal<ElementDto[]>([]);
    public collectionSubscription: (() => void) | null = null;

    private async updateCollectionElementSubscription(
        collection: VersionedCollectionPartial
    ) {
        this.collectionSubscription?.();
        this.collectionSubscription =
            this.collectionService.subscribeToCollection(
                collection.entityId,
                (elements) => {
                    //TODO: @Quixelation: direct does not yet include 1st level dependencies, and transiive inclues all (too many levels)
                    this.elementsOfSelectedCollection.set(
                        elements.objects.direct
                    );
                }
            );
        const collectionUpdateAvailable =
            await this.collectionService.checkNewerVersionAvailable(collection);
        this.updateAvailable.set(collectionUpdateAvailable);
    }

    public async selectCollection(collection: CollectionDto) {
        const result = await this.exerciseService.proposeAction({
            type: '[Collection] Set Exercise Collection',
            collectionVersion: {
                versionId: collection.versionId,
                entityId: collection.entityId,
            },
        });
    }

    public async upgradeCollectionVersion() {
        console.log(
            'Calculating change impacts of upgrading collection version...'
        );
        //TODO: @Quixelation: Support more than just vehicles
        const allExerciseVehicles = selectStateSnapshot(
            selectVehicles,
            this.store
        );

        if (allExerciseVehicles === undefined) {
            console.warn(
                'No exercise vehicles found, cannot calculate change impacts of upgrading collection version.'
            );
            return;
        }

        const currentCollection = this.elementsOfSelectedCollection();

        const selectedCollection = this.selectedCollection();
        if (selectedCollection === null) {
            console.warn(
                'No collection selected, cannot calculate change impacts of upgrading collection version.'
            );
            return;
        }

        const newerCollectionVersionAvailable = this.updateAvailable();
        if (
            !newerCollectionVersionAvailable ||
            newerCollectionVersionAvailable.newerVersionAvailable === false
        ) {
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
            //TODO: this is not always correct - actually fetch the data here
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
    }

    private async calcChangeImpact(data: {
        previous: ElementDto[];
        inExercise: InExerciseElement[];
        new: ElementDto[];
    }): Promise<ChangeImpact[]> {
        const {
            addedElements,
            editedNewElements,
            removedElements,
            unchangedElements,
        } = await this.checkForChangesBetweenVersions(data.previous, data.new);

        console.log({
            data,
            addedElements,
            editedNewElements,
            removedElements,
            unchangedElements,
        });

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

type InExerciseElement = Vehicle;

export type ChangeImpact =
    | EditableElementChangeImpact
    | RemovedElementChangeImpact
    | AddedElementChangeImpact;

export interface AddedElementChangeImpact {
    id: string;
    type: 'added';
    element: ElementDto;
}

export interface RemovedElementChangeImpact {
    id: string;
    type: 'removed';
    element: InExerciseElement;
    entity: ElementDto;
}

export interface EditableElementChangeImpact {
    id: string;
    type: 'editable';
    element: InExerciseElement;
    oldValue: string;
    currentValue: string;
    newValue: string;
}
