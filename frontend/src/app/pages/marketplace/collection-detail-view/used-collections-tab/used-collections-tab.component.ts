import { Component, computed, inject, input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { checkCollectionRole } from 'fuesim-digital-shared';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../../core/exercise-element.service';
import { openSelectCollectionModal } from '../../shared/modals/marketplace-select-collection-modal/select-collection-modal';
import { UsedCollectionItemComponent } from './used-collection-item/used-collection-item.component';

@Component({
    selector: 'app-used-collections-tab',
    imports: [UsedCollectionItemComponent],
    templateUrl: './used-collections-tab.component.html',
    styleUrl: './used-collections-tab.component.scss',
})
export class UsedCollectionsTabComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);

    public readonly canRemoveCollection = input<boolean>(false);
    public readonly collectionData =
        input.required<CollectionSubscriptionData>();

    public readonly alreadyImportedCollectionVersions = computed(() =>
        this.collectionData().objects.imported.map(
            (transitiveData) => transitiveData.collection.versionId
        )
    );

    public readonly checkRole = checkCollectionRole.bind(this);

    public async openCollectionSelectionModal() {
        const result = await openSelectCollectionModal(this.ngbModalService, {
            disallowedCollections: [
                this.collectionData().collection.entityId,
                ...this.collectionData().objects.imported.map(
                    (m) => m.collection.entityId
                ),
            ],
            showDependencyElements: false,
        });
        if (!result) return;
        await this.collectionService.addCollectionDependency({
            importTo: this.collectionData().collection.entityId,
            importFrom: result.versionId,
        });
    }
}
