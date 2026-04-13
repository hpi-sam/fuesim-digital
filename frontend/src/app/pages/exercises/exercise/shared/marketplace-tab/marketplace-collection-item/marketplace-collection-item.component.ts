import { Component, inject, input, resource } from '@angular/core';
import { VersionedCollectionPartial } from 'fuesim-digital-shared';
import { CollectionService } from '../../../../../../core/exercise-element.service';
import { ExerciseService } from '../../../../../../core/exercise.service';

@Component({
    selector: 'app-marketplace-collection-item-component',
    templateUrl: './marketplace-collection-item.component.html',
    styleUrl: './marketplace-collection-item.component.scss',
    imports: [],
})
export class MarketplaceColletionItemComponent {
    private readonly exerciseService = inject(ExerciseService);
    private readonly collectionService = inject(CollectionService);

    public readonly collection = input.required<VersionedCollectionPartial>();

    public readonly collectionData = resource({
        params: () => ({
            collection: this.collection(),
        }),
        loader: ({ params: { collection } }) =>
            this.collectionService.getCollectionVersion(collection),
    });

    public readonly newerVersionAvailable = resource({
        params: () => ({
            collection: this.collection(),
        }),
        loader: ({ params: { collection } }) =>
            this.collectionService.checkNewerVersionAvailable(collection),
    });

    public async removeCollection(collection: VersionedCollectionPartial) {
        const elements =
            await this.collectionService.getElementsOfCollectionVersion(
                collection
            );
        await this.exerciseService.proposeAction({
            type: '[Collection] Remove Collection',
            collectionEntity: collection.entityId,
            elements: [
                ...elements.direct,
                ...elements.transitive.map((m) => m.elements).flat(),
            ],
        });
        //TODO: Keep in mind, that some elements may still be transitive dependencies of other collections!
        //WE SHOULD NOT REMOVE THEM IN THIS CASE!
    }
}
