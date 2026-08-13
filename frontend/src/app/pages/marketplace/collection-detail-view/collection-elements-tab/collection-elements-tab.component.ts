import {
    Component,
    computed,
    input,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    checkCollectionMembershipRole,
    gatherAllVisibleCollectionElements,
} from 'fuesim-digital-shared';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { CollectionSubscriptionData } from '../../../../core/collection.service';
import { CollectionElementsListComponent } from '../../shared/collection-elements-list/collection-elements-list.component';

@Component({
    selector: 'app-collection-elements-tab',
    imports: [NgbDropdownModule, CollectionElementsListComponent],
    styleUrl: './collection-elements-tab.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
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
