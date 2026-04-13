import { Component, computed, input } from '@angular/core';
import {
    ElementDto,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { ElementCardComponent } from '../../element-card/element-card.component';
import { VersionedElementDisplayNamePipe } from '../../../../shared/pipes/versioned-element-type-display-name.pipe';

@Component({
    selector: 'app-collection-elements-list',
    templateUrl: './collection-elements-list.component.html',
    styleUrl: './collection-elements-list.component.scss',
    imports: [ElementCardComponent, VersionedElementDisplayNamePipe],
})
export class CollectionElementsListComponent {
    public readonly collection = input.required<VersionedCollectionPartial>();
    public readonly collectionElements = input.required<ElementDto[]>();
    public readonly editable = input(true);

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypesOrder: VersionedElementContent['type'][] = [
        'vehicleTemplate',
        'alarmGroup',
    ];

    public readonly elementsGroupedByType = computed(() => {
        return this.collectionElements().reduce<{
            [type: string]: ElementDto[];
        }>((acc, element) => {
            const type = element.content.type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(element);
            return acc;
        }, {});
    });
}
