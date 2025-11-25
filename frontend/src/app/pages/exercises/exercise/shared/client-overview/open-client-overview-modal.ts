import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientOverviewModalComponent } from './client-overview-modal/client-overview-modal.component.js';

export function openClientOverviewModal(ngbModalService: NgbModal) {
    ngbModalService.open(ClientOverviewModalComponent, {
        size: 'lg',
    });
}
