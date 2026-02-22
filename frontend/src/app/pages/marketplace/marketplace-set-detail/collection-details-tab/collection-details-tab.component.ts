import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { CollectionDto, CollectionEntityId } from 'fuesim-digital-shared';
import { CollectionService } from '../../../../core/exercise-element.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';

@Component({
    selector: 'app-collection-details-tab',
    imports: [AsyncPipe, JsonPipe, FormsModule, DisplayValidationComponent],
    templateUrl: './collection-details-tab.component.html',
    styleUrl: './collection-details-tab.component.scss',
})
export class CollectionDetailsTabComponent {
    private readonly collectionService = inject(CollectionService);
    private readonly router = inject(Router);

    public readonly collectionTitle = signal('');
    public readonly collection = input.required<CollectionDto>();

    constructor() {
        effect(() => {
            this.collectionTitle.set(this.collection().title);
        });
    }

    public async updateCollectionTitle() {
        await this.collectionService.updateCollectionData(
            this.collection().entityId,
            {
                title: this.collectionTitle(),
            }
        );
    }

    public async makeSetPublic() {
        await this.collectionService.makeCollectionPublic(
            this.collection().entityId
        );
    }

    public async deleteSet() {
        await this.collectionService.deleteCollection(
            this.collection().entityId
        );
        this.router.navigate(['/marketplace']);
    }
}
