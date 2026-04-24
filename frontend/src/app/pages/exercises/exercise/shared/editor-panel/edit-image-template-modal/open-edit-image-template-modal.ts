import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { EditImageTemplateModalComponent } from './edit-image-template-modal.component';

export async function openEditImageTemplateModal(
    ngbModalService: NgbModal,
    mapImageTemplateId: UUID
) {
    const modalRef = ngbModalService.open(EditImageTemplateModalComponent);
    const componentInstance =
        modalRef.componentInstance as EditImageTemplateModalComponent;
    componentInstance.mapImageTemplateId = mapImageTemplateId;
}
