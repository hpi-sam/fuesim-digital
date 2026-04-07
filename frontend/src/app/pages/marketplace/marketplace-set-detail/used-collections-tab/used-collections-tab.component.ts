import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject, input, resource } from '@angular/core';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {
    checkCollectionRole,
    CollectionVersionId,
} from 'fuesim-digital-shared';
import { ElementCardComponent } from '../../element-card/element-card.component';
import {
    CollectionService,
    CollectionSubscriptionData,
} from '../../../../core/exercise-element.service';
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

    public readonly collectionData =
        input.required<CollectionSubscriptionData>();

    public availableCollections = resource({
        loader: async () =>
            this.collectionService.getMyCollections({
                includeDraftState: false,
                archived: false,
            }),
    });

    public readonly checkRole = checkCollectionRole.bind(this);

    public async importFromCollection(
        collectionVersionId: CollectionVersionId
    ) {
        await this.collectionService.addCollectionDependency({
            importTo: this.collectionData().collection.entityId,
            importFrom: collectionVersionId,
        });
    }
}
