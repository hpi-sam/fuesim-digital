import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { VersionedCollectionPartial } from 'fuesim-digital-shared';
import { CreateCollectionModalComponent } from './create-collection-modal.component';

export function openCreateCollectionModal(
    ngbModal: NgbModal,
    opts?: {
        basedOnCollection?: VersionedCollectionPartial;
        prefilledName?: string;
    }
) {
    const modalRef = ngbModal.open(CreateCollectionModalComponent, {
        size: 'md',
    });

    const component =
        modalRef.componentInstance as CreateCollectionModalComponent;

    component.basedOnCollection = opts?.basedOnCollection ?? null;
    component.prefilledName = opts?.prefilledName ?? '';

    return component.created;
}
