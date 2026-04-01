import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject, input, resource } from '@angular/core';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {
    CollectionEntityId,
    Marketplace,
    CollectionVersionId,
} from 'fuesim-digital-shared';
import * as z from 'zod';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ElementCardComponent } from '../../../element-card/element-card.component';

@Component({
    selector: 'app-used-collection-item',
    imports: [
        ElementCardComponent,
        NgbDropdownModule,
        NgbNavModule,
        AsyncPipe,
        JsonPipe,
    ],
    templateUrl: './used-collection-item.component.html',
    styleUrl: './used-collection-item.component.scss',
})
export class UsedCollectionItemComponent {
    private readonly collectionService = inject(CollectionService);

    public readonly currentCollectionEntityId =
        input.required<CollectionEntityId>();
    public readonly dependency =
        input.required<
            z.infer<typeof Marketplace.Collection.transitiveCollectionSchema>
        >();

    public readonly newerVersionAvailable = resource({
        params: () => ({ collection: this.dependency().collection }),
        loader: async ({ params: { collection } }) =>
            this.collectionService.checkNewerVersionAvailable(collection),
    });

    public async upgradeVersion() {
        const value = this.newerVersionAvailable.value();
        if (!value) return;
        const newVersion = value.newerVersionAvailable && value.latestVersion;
        await this.collectionService.addCollectionDependency({
            importTo: this.currentCollectionEntityId(),
            importFrom: newVersion.versionId,
        });
    }

    public async removeCollectionDependency(
        collectionVersionId: CollectionVersionId
    ) {
        await this.collectionService.removeCollectionDependency({
            removeFrom: this.currentCollectionEntityId(),
            removeVersionId: collectionVersionId,
        });
    }
}
