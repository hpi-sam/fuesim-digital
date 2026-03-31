import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ElementCardComponent } from '../../element-card/element-card.component';
import {
    CollectionEntityId,
    CollectionVersionId,
    Marketplace,
    VersionedCollectionPartial,
} from 'fuesim-digital-shared';
import { CollectionService } from '../../../../core/exercise-element.service';
import * as z from 'zod';
import { UsedCollectionItemComponent } from './used-collection-item/used-collection-item.component';

@Component({
    selector: 'app-used-collections-tab',
    imports: [
        ElementCardComponent,
        UsedCollectionItemComponent,
        NgbDropdownModule,
        NgbNavModule,
        AsyncPipe,
        JsonPipe,
    ],
    templateUrl: './used-collections-tab.component.html',
    styleUrl: './used-collections-tab.component.scss',
})
export class UsedCollectionsTabComponent {
    private readonly collectionService = inject(CollectionService);

    public readonly currentCollectionEntityId =
        input.required<CollectionEntityId>();
    public readonly importedCollections =
        input.required<
            z.infer<typeof Marketplace.Set.transitiveCollectionSchema>[]
        >();

    public availableCollections = this.collectionService.elementSets;

    public async importFromCollection(
        collectionVersionId: CollectionVersionId
    ) {
        await this.collectionService.addCollectionDependency({
            importTo: this.currentCollectionEntityId(),
            importFrom: collectionVersionId,
        });
    }

}
