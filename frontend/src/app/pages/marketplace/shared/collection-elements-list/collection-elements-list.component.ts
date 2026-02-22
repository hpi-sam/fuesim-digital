import { Component, computed, inject, input, signal } from '@angular/core';
import {
    ChangeElementType,
    TemplateVersion,
    gatherCollectionElements,
    getCollectionElementDiff,
    VersionedCollectionPartial,
    MarketplaceElementContent,
    CollectionElements,
    ChangedTemplateVersion,
} from 'fuesim-digital-shared';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Immutable } from 'immer';
import { VersionedElementDisplayNamePipe } from '../../../../shared/pipes/versioned-element-type-display-name.pipe';
// its a nessesary evil
// eslint-disable-next-line import/no-cycle
import { ElementCardComponent } from '../cards/element-card/element-card.component';
import { CreatingVersionedElementModalData } from '../modals/editor-modals/base-versioned-element-submodal';
import { CollectionService } from '../../../../core/exercise-element.service';
import { GenericElementCardIndicator } from '../cards/generic-element-card/generic-element-card.component';
import { FileInputDirective } from '../../../../shared/directives/file-input.directive';
import { MessageService } from '../../../../core/messages/message.service';
import { openVersionedElementModal } from '../modals/editor-modals/versioned-element-modal/open-versioned-element-model';
import { ConfirmationModalService } from '../../../../core/confirmation-modal/confirmation-modal.service';

@Component({
    selector: 'app-collection-elements-list',
    templateUrl: './collection-elements-list.component.html',
    styleUrl: './collection-elements-list.component.scss',
    imports: [
        ElementCardComponent,
        VersionedElementDisplayNamePipe,
        FileInputDirective,
    ],
})
export class CollectionElementsListComponent {
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationModalService);
    public readonly ngbModalService = inject(NgbModal);
    public readonly collectionService = inject(CollectionService);

    public readonly collection = input.required<VersionedCollectionPartial>();
    public readonly collectionElements = input.required<CollectionElements>();
    public readonly publishedElements = input<Immutable<
        TemplateVersion[]
    > | null>(null);
    public readonly editable = input(true);
    public readonly showImportedElements = input(false);
    public readonly allowCreation = input(false);
    public readonly smallCards = input(false);

    public readonly importingElements = signal<boolean>(false);

    // INFO:
    // This array defined the order in which the element types are displayed in the UI.
    // Types not included in this array will NOT be displayed in the UI
    public visibleElementTypes: {
        type: MarketplaceElementContent['type'];
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
        {
            type: 'materialTemplate',
            create: () => {
                this.createElementHelper('materialTemplate');
            },
        },
        {
            type: 'personnelTemplate',
            create: () => {
                this.createElementHelper('personnelTemplate');
            },
        },
        {
            type: 'mapImageTemplate',
            create: () => {
                this.createElementHelper('mapImageTemplate');
            },
        },
    ];

    public getElementCardIndicatorForChangeType(
        changeType: ChangedTemplateVersion['type'] | undefined
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

    private createElementHelper(type: MarketplaceElementContent['type']) {
        openVersionedElementModal(
            this.ngbModalService,
            this.confirmationService,
            {
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
            } satisfies CreatingVersionedElementModalData<any>
        );
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
                    [type: string]: TemplateVersion[];
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
