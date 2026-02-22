import { JsonPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import {
    ElementDto,
    Marketplace,
    VehicleTemplate,
    vehicleTemplateSchema,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { ValuesPipe } from '../../../shared/pipes/values.pipe';
import { GenericElementCardComponent } from '../generic-element-card/generic-element-card.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
    VersionedElementModalComponent,
    EditingVersionedElementModalData,
} from '../editor-modals/versioned-element-modal/versioned-element-modal.component';
import { CollectionService } from '../../../core/exercise-element.service';

@Component({
    selector: 'app-element-card',
    imports: [ValuesPipe, GenericElementCardComponent],
    templateUrl: './element-card.component.html',
    styleUrl: './element-card.component.scss',
})
export class ElementCardComponent {
    private readonly ngbModalService = inject(NgbModal);
    private readonly collectionService = inject(CollectionService);

    public readonly availableElements = input<ElementDto[]>([]);

    public readonly collection = input<VersionedCollectionPartial>();
    public readonly element = input.required<ElementDto>();
    public readonly editable = input(true);

    constructor() {
        if (this.editable() && this.collection === undefined) {
            throw new Error(
                'ElementCardComponent is editable but no collection was provided.'
            );
        }
    }

    openEditor() {
        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            isEditMode: true,
            type: this.element().content.type,
            onSubmit: async (data) => {
                this.collectionService.updateElement(
                    this.element().entityId,
                    data,
                    this.collection()!.entityId
                );
            },
            collection: this.collection()!,
            element: this.element(),
            availableCollectionElements: this.availableElements(),
        } satisfies EditingVersionedElementModalData<VersionedElementContent>;
    }

    async deleteElement() {
        await this.collectionService.deleteElement(
            this.element().entityId,
            this.collection()!.entityId
        );
    }

    async duplicateElement() {
        this.collectionService.duplicateElement({
            collectionEntity: this.collection()!.entityId,
            element: this.element()
        })
    }
}
