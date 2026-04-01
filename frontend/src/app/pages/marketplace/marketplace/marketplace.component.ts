import { Component, inject, resource } from '@angular/core';
import { CollectionService } from '../../../core/exercise-element.service';
import { DatePipe, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss',
    imports: [JsonPipe, DatePipe, RouterLink],
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
    }
}
