import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../core/exercise-element.service';
import { CollectionCardComponent } from '../shared/cards/collection-card/collection-card.component';
import { openCreateCollectionModal } from '../shared/modals/create-collection-modal/open-create-collection-modal';

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss',
    imports: [RouterLink, NgbTooltip, CollectionCardComponent],
})
export class MarketplaceComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly ngbModalService = inject(NgbModal);

    public readonly userAvailableCollections = resource({
        loader: async () => this.collectionService.getMyCollections(),
    });

    public readonly publicCollections = resource({
        loader: async () => this.collectionService.getPublicCollections(),
    });

    public async createNewCollection() {
        openCreateCollectionModal(this.ngbModalService).subscribe((created) => {
            if (created) {
                this.userAvailableCollections.reload();
            }
        });
    }
}
