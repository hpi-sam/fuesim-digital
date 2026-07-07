import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateCollectionModalComponent } from './create-collection-modal.component';

export function openCreateCollectionModal(ngbModal: NgbModal) {
    const modalRef = ngbModal.open(CreateCollectionModalComponent, {
        size: 'md',
    });

    const component =
        modalRef.componentInstance as CreateCollectionModalComponent;

    return component.created;
}
