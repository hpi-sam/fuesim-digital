import { Component, computed, inject, resource, signal } from '@angular/core';
import {
    CollectionDto,
    CollectionEntityId,
    gatherCollectionElements,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';
import { CollectionElementsListComponent } from '../../collection-elements-list/collection-elements-list.component';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { CollectionCardComponent } from '../../cards/collection-card/collection-card.component';

@Component({
    selector: 'app-select-collection-modal',
    templateUrl: './marketplace-select-collection-modal.component.html',
    styleUrl: './marketplace-select-collection-modal.component.scss',
    imports: [
        CollectionElementsListComponent,
        DatePipe,
        CollectionCardComponent,
    ],
})
export class MarketplaceSelectCollectionModalComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    public disallowedCollections: CollectionEntityId[] = [];
    public collectionSelectionResult$ = new Subject<CollectionDto | null>();
    public showDependencyElements = false;

    public readonly userAvailableCollections = resource({
        loader: async () =>
            this.collectionService.getMyCollections({
                includeDraftState: false,
            }),
    });

    public readonly selectedCollectionData = resource({
        params: () => ({
            collection: this.selectedCollection(),
        }),
        loader: async ({ params: { collection } }) =>
            collection
                ? Promise.all([
                      this.collectionService.getCollectionVersion(collection),
                      this.collectionService.getElementsOfCollectionVersion(
                          collection
                      ),
                  ])
                : Promise.resolve(null),
    });

    public readonly selectedCollectionCanBeChosen = computed(() => {
        const collection = this.selectedCollection();
        if (collection === null) return false;
        return !this.disallowedCollections.includes(collection.entityId);
    });

    public readonly selectedCollectionDataElements = computed(() => {
        const data = this.selectedCollectionData.value();
        if (!data) return [];

        if (this.showDependencyElements) {
            return gatherCollectionElements(data[1]).allVisibleElements();
        }
        return data[1].direct;
    });

    public readonly selectedCollection =
        signal<VersionedCollectionPartial | null>(null);

    public selectCollection(id: VersionedCollectionPartial | null) {
        this.selectedCollection.set(id);
    }

    public close(collection: CollectionDto | null) {
        this.collectionSelectionResult$.next(collection);
        this.collectionSelectionResult$.complete();
        this.activeModal.close();
    }
}
