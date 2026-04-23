import { Component, computed, input } from '@angular/core';
import {
    ChangeElementType,
    CollectionElementsDto,
    ElementDto,
    gatherCollectionElements,
    getCollectionElementDiff,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { VersionedElementDisplayNamePipe } from '../../../../shared/pipes/versioned-element-type-display-name.pipe';
import { ElementCardComponent } from '../cards/element-card/element-card.component';

@Component({
    selector: 'app-collection-elements-list',
    templateUrl: './collection-elements-list.component.html',
    styleUrl: './collection-elements-list.component.scss',
    imports: [ElementCardComponent, VersionedElementDisplayNamePipe],
})
export class CollectionElementsListComponent {
    public readonly collection = input.required<VersionedCollectionPartial>();
    public readonly collectionElements =
        input.required<CollectionElementsDto>();
    public readonly publishedElements = input<ElementDto[] | null>(null);
    public readonly editable = input(true);

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypesOrder: VersionedElementContent['type'][] = [
        'vehicleTemplate',
        'alarmGroup',
    ];

    public readonly elementHasChanges = computed(() => {
        const publishedElements = this.publishedElements();
        if (!publishedElements) return {};
        const changes = getCollectionElementDiff(
            publishedElements,
            gatherCollectionElements(
                this.collectionElements()
            ).allDirectElements()
        );
        return changes.reduce<{ [entityId: string]: ChangeElementType }>(
            (acc, change) => {
                acc[change.old?.entityId ?? change.new!.entityId] = change.type;
                return acc;
            },
            {}
        );
    });

    public readonly visibleElements = computed(() => [
        ...gatherCollectionElements(
            this.collectionElements()
        ).allDirectElements(),
        ...(this.publishedElements() ?? []).filter(
            (f) => this.elementHasChanges()[f.entityId] === 'remove'
        ),
    ]);

    public readonly elementsGroupedByType = computed(() =>
        Object.fromEntries(
            Object.entries(
                this.visibleElements().reduce<{
                    [type: string]: ElementDto[];
                }>((acc, element) => {
                    const type = element.content.type;
                    acc[type] ??= [];
                    acc[type].push(element);
                    return acc;
                }, {})
            ).map(([type, elements]) => [
                type,
                elements.sort((a, b) => a.title.localeCompare(b.title)),
            ])
        )
    );
}
