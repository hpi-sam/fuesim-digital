import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, inject, input, resource } from '@angular/core';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {
    CollectionEntityId,
    Marketplace,
    VersionedCollectionPartial,
    CollectionVersionId,
} from 'fuesim-digital-shared';
import * as z from 'zod';
import { CollectionService } from '../../../../../core/exercise-element.service';
import { ElementCardComponent } from '../../../element-card/element-card.component';
import { httpResource } from '@angular/common/http';

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
            z.infer<typeof Marketplace.Set.transitiveCollectionSchema>
        >();

    public readonly newerVersionAvailable = resource({
        params: () => ({ collection: this.dependency().collection }),
        loader: async ({ params: { collection } }) =>
            await this.collectionService.checkNewerVersionAvailable(collection),
    });

    public async upgradeVersion() {
        console.log('ARASCH');
        const value = this.newerVersionAvailable.value();
        console.log('check newer version', value);
        if (!value) return;
        const newVersion = value.newerVersionAvailable && value.latestVersion;
        console.log('new version', newVersion);
        await this.collectionService.addCollectionDependency({
            importTo: this.currentCollectionEntityId(),
            importFrom: newVersion.versionId,
        });
    }
}
