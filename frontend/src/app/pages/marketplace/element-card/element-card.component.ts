import { Component, inject, input, OnInit } from '@angular/core';
import {
    ElementDto,
    VersionedCollectionPartial,
    VersionedElementContent,
} from 'fuesim-digital-shared';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ValuesPipe } from '../../../shared/pipes/values.pipe';
import { GenericElementCardComponent } from '../generic-element-card/generic-element-card.component';
import { VersionedElementModalComponent } from '../editor-modals/versioned-element-modal/versioned-element-modal.component';
import { CollectionService } from '../../../core/exercise-element.service';
import { EditingVersionedElementModalData, VersionedElementModalData } from '../editor-modals/base-versioned-element-submodal';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';

@Component({
    selector: 'app-element-card',
    imports: [ValuesPipe, GenericElementCardComponent],
    templateUrl: './element-card.component.html',
    styleUrl: './element-card.component.scss',
})
export class ElementCardComponent {
    private readonly ngbModalService = inject(NgbModal);
    private readonly collectionService = inject(CollectionService);
    private readonly confirmationService = inject(ConfirmationModalService)

    public readonly availableElements = input<ElementDto[]>([]);

    public readonly collection = input.required<VersionedCollectionPartial>();
    public readonly element = input.required<ElementDto>();
    public readonly mode = input.required<EditingVersionedElementModalData<any>["mode"]>();


    openEditor() {
        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            mode: this.mode(),
            type: this.element().content.type,
            onSubmit: async (data, conflictResolution) => {
                this.collectionService.updateElement(
                    this.element().entityId,
                    data,
                    this.collection()!.entityId,
                    conflictResolution
                );
            },
            collection: this.collection()!,
            element: this.element(),
            availableCollectionElements: this.availableElements(),
        } satisfies EditingVersionedElementModalData<VersionedElementContent>;
    }

    async deleteElement() {
        const confirmation = await this.confirmationService.confirm({
            title: 'Element löschen',
            description: `Möchten Sie das Element "${this.element().title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
            confirmationButtonText: "Unwiederuflich löschen",
        })
        if(!confirmation) return;
        await this.collectionService.deleteElement(
            this.element().entityId,
            this.collection()!.entityId
        );
    }

    async duplicateElement() {
        this.collectionService.duplicateElement({
            collectionEntity: this.collection()!.entityId,
            element: this.element(),
        });
    }
}
