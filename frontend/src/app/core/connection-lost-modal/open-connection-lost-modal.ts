import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionLostModalComponent } from './connection-lost-modal.component';

export function openConnectionLostModal(ngbModalService: NgbModal) {
    ngbModalService.open(ConnectionLostModalComponent, {
        size: 'xl',
        beforeDismiss: () => false,
        centered: true,
    });
}
