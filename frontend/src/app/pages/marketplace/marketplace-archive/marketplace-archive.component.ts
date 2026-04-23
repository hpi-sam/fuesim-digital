import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionService } from '../../../core/exercise-element.service';
import { CollectionCardComponent } from '../shared/cards/collection-card/collection-card.component';

@Component({
    selector: 'app-marketplace-archive',
    imports: [RouterLink, CollectionCardComponent],
    templateUrl: './marketplace-archive.component.html',
    styleUrl: './marketplace-archive.component.scss',
})
export class MarketplaceArchiveComponent {
    private readonly collectionService = inject(CollectionService);

    public readonly userAvailableCollections = resource({
        loader: async () =>
            this.collectionService.getMyCollections({
                includeDraftState: true,
                archived: true,
            }),
    });
}
