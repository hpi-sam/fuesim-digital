import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateImageTemplateModalComponent } from './create-image-template-modal.component';

export async function openCreateImageTemplateModal(ngbModalService: NgbModal) {
    ngbModalService.open(CreateImageTemplateModalComponent);
}
