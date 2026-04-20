import { Component, computed, input } from '@angular/core';
import {
    ChangeElementType,
    ElementDto,
    getCollectionElementDiff,
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
    public readonly publishedElements = input<ElementDto[]>([]);
    public readonly editable = input(true);

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypesOrder: VersionedElementContent['type'][] = [
        'vehicleTemplate',
        'alarmGroup',
    ];

    public readonly elementHasChanges = computed(() => {
        const changes = getCollectionElementDiff(
            this.publishedElements(),
            this.collectionElements()
        );
        return changes.reduce(
            (acc, change) => {
                acc[change.old?.entityId ?? change.new!.entityId] = change.type;
                return acc;
            },
            {} as { [entityId: string]: ChangeElementType }
        );
    });

    public readonly elementsGroupedByType = computed(() => {
        const elements = [
            ...this.collectionElements(),
            ...this.publishedElements().filter(
                (f) => this.elementHasChanges()[f.entityId] === 'remove'
            ),
        ];
        return elements.reduce<{
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
