import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CollectionService } from '../../../core/exercise-element.service';
import { CollectionCardComponent } from '../shared/cards/collection-card/collection-card.component';
import { PromptModalService } from '../../../core/prompt-modal/prompt-modal.service';

@Component({
    selector: 'app-marketplace',
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss',
    imports: [RouterLink, NgbTooltip, CollectionCardComponent],
})
export class MarketplaceComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly promptModalService = inject(PromptModalService);

    public readonly userAvailableCollections = resource({
        loader: async () => this.collectionService.getMyCollections(),
    });

    public async createNewCollection() {
        const title = await this.promptModalService.prompt({
            title: 'Neue Sammlung erstellen',
            description: 'Gebe einen Titel für deine neue Sammlung ein.',
            confirmationButtonText: 'Erstellen',
        });
        if (!title.result) return;
        await this.collectionService.createColletion(title.value);
        this.userAvailableCollections.reload();
    }
}
