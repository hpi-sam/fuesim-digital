import { Component, inject, resource } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CollectionService } from '../../../core/exercise-element.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionCardComponent } from '../collection-card/collection-card.component';

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss',
    imports: [RouterLink, NgbTooltip, CollectionCardComponent],
})
export class MarketplaceComponent {
    private readonly collectionService = inject(CollectionService);

    public readonly userAvailableCollections = resource({
        loader: async () => this.collectionService.getMyCollections(),
    });

    public async createNewCollection() {
        const title = prompt('Name der Sammlung');
        if (!title) return;
        await this.collectionService.createColletion(title);
        this.userAvailableCollections.reload();
    }
}
