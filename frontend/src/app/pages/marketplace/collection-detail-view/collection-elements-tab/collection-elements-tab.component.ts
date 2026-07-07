import { Component, computed, input } from '@angular/core';
import {
    checkCollectionMembershipRole,
    gatherAllVisibleCollectionElements,
} from 'fuesim-digital-shared';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CollectionSubscriptionData } from '../../../../core/exercise-element.service';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive';
import { CollectionElementsListComponent } from '../../shared/collection-elements-list/collection-elements-list.component';

@Component({
    selector: 'app-collection-elements-tab',
    imports: [
        NgbDropdownModule,
        FileInputDirective,
        CollectionElementsListComponent,
    ],
    styleUrl: './collection-elements-tab.component.scss',
    templateUrl: './collection-elements-tab.component.html',
})
export class CollectionElementsTabComponent {
    public readonly collectionData =
        input.required<CollectionSubscriptionData>();

    public readonly availableElements = computed(() => {
        const selectedCollectionData = this.collectionData();

        return gatherAllVisibleCollectionElements(
            selectedCollectionData.objects
        );
    });

    public readonly checkRole = checkCollectionMembershipRole.bind(this);
}
