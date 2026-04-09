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
import { EditingVersionedElementModalData } from '../editor-modals/base-versioned-element-submodal';
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
    private readonly confirmationService = inject(ConfirmationModalService);

    public readonly availableElements = input<ElementDto[]>([]);

    public readonly collection = input.required<VersionedCollectionPartial>();
    public readonly element = input.required<ElementDto>();
    public readonly mode = input<
        EditingVersionedElementModalData<any>['mode'] | 'static'
    >('static');

    openEditor() {
        const mode = this.mode();
        if (mode === 'static') return;
        const modal = this.ngbModalService.open(
            VersionedElementModalComponent,
            {
                size: 'xl',
            }
        );
        modal.componentInstance.data = {
            mode,
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
            confirmationButtonText: 'Unwiederuflich löschen',
        });
        if (!confirmation) return;
        const result = await this.collectionService.deleteElement(
            this.element().entityId,
            this.collection()!.entityId
        );
        if (result.requiresConfirmation.length > 0) {
            const cascadingConfirmation =
                await this.confirmationService.confirm({
                    title: 'Element in weiteren Elementen verwendet',
                    description: `Das Element "${this.element().title}" wird in folgenden Elementen verwendet: ${result.requiresConfirmation.map((e) => `"${e.title}"`).join(', ')}. Wenn Sie es jetzt löschen wird es auch aus diesen weiteren Elemente entfernt. Möchten Sie es trotzdem löschen?`,
                    confirmationButtonText: `Unwiederuflich aus ${result.requiresConfirmation.length} Elementen löschen`,
                });

            if (!cascadingConfirmation) return;
            await this.collectionService.deleteElement(
                this.element().entityId,
                this.collection()!.entityId,
                result.requiresConfirmation.map((e) => e.versionId)
            );
        }
    }

    async duplicateElement() {
        this.collectionService.duplicateElement({
            collectionEntity: this.collection()!.entityId,
            element: this.element(),
        });
    }
}
