import { Component, computed, inject, input } from '@angular/core';
import {
    ChangedElementDto,
    ChangeElementType,
    CollectionElementsDto,
    ElementDto,
    gatherCollectionElements,
    getCollectionElementDiff,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VersionedElementDisplayNamePipe } from '../../../../shared/pipes/versioned-element-type-display-name.pipe';
import { ElementCardComponent } from '../cards/element-card/element-card.component';
import { CreatingVersionedElementModalData } from '../modals/editor-modals/base-versioned-element-submodal';
import { VersionedElementModalComponent } from '../modals/editor-modals/versioned-element-modal/versioned-element-modal.component';
import { CollectionService } from '../../../../core/exercise-element.service';
import { GenericElementCardIndicator } from '../cards/generic-element-card/generic-element-card.component';

@Component({
    selector: 'app-collection-elements-list',
    templateUrl: './collection-elements-list.component.html',
    styleUrl: './collection-elements-list.component.scss',
    imports: [ElementCardComponent, VersionedElementDisplayNamePipe],
})
export class CollectionElementsListComponent {
    public readonly ngbModalService = inject(NgbModal);
    public readonly collectionService = inject(CollectionService);

    public readonly collection = input.required<VersionedCollectionPartial>();
    public readonly collectionElements =
        input.required<CollectionElementsDto>();
    public readonly publishedElements = input<ElementDto[] | null>(null);
    public readonly editable = input(true);
    public readonly showImportedElements = input(false);
    public readonly allowCreation = input(false);
    public readonly smallCards = input(false);

    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypes: {
        type: VersionedElementContent['type'];
        create: () => void;
    }[] = [
        {
            type: 'vehicleTemplate',
            create: () => {
                this.createElementHelper('vehicleTemplate');
            },
        },
        {
            type: 'alarmGroup',
            create: () => {
                this.createElementHelper('alarmGroup');
            },
        },
    ];

    public getElementCardIndicatorForChangeType(
        changeType: ChangedElementDto['type'] | undefined
    ): GenericElementCardIndicator | undefined {
        switch (changeType) {
            case 'create':
                return 'created';
            case 'update':
                return 'changed';
            case 'remove':
                return 'ghost';
            default:
                return undefined;
        }
    }

    private createElementHelper(type: VersionedElementContent['type']) {
        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            type,
            mode: 'create',
            onSubmit: async (data: any) => {
                await this.collectionService.createElement(
                    this.collection().entityId,
                    data
                );
            },
            collection: this.collection(),
            availableCollectionElements: gatherCollectionElements(
                this.collectionElements()
            ).allVisibleElements(),
        } satisfies CreatingVersionedElementModalData<any>;
    }

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
        ...(this.showImportedElements()
            ? gatherCollectionElements(
                  this.collectionElements()
              ).allImportedElements()
            : []),
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
