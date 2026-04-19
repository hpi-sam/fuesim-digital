import { Component, computed, inject, resource, signal } from '@angular/core';
import { CollectionService } from '../../../../../../core/exercise-element.service';
import {
    CollectionDto,
    CollectionEntityId,
    CollectionVersionId,
    gatherCollectionElements,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { CollectionElementsListComponent } from '../../../../../marketplace/marketplace-set-detail/collection-elements-list/collection-elements-list.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { DatePipe } from '@angular/common';

@Component({
    templateUrl: './marketplace-select-collection-modal.component.html',
    styleUrl: './marketplace-select-collection-modal.component.scss',
    imports: [CollectionElementsListComponent, DatePipe],
})
export class MarketplaceSelectCollectionModalComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly activeModal = inject(NgbActiveModal);

    public disallowedCollections: CollectionEntityId[] = [];
    public collectionSelectionResult$ = new Subject<CollectionDto | null>();
    public showDependencyElements = false;

    public readonly userAvailableCollections = resource({
        loader: () =>
            this.collectionService.getMyCollections({
                includeDraftState: false,
            }),
    });

    public readonly selectedCollectionData = resource({
        params: () => ({
            collection: this.selectedCollection(),
        }),
        loader: ({ params: { collection } }) =>
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
        if(this.showDependencyElements) {
            return gatherCollectionElements(data[1]).allVisibleElements()
        } else {
            return data[1].direct
        }
    });

    public readonly selectedCollection =
        signal<VersionedCollectionPartial | null>(null);

    public selectCollection(id: VersionedCollectionPartial) {
        this.selectedCollection.set(id);
    }

    public close(collection: CollectionDto | null) {
        this.collectionSelectionResult$.next(collection);
        this.collectionSelectionResult$.complete();
        this.activeModal.close();
    }
}
