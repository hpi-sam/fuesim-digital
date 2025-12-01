import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransferOverviewModalComponent } from './transfer-overview-modal/transfer-overview-modal.component';

export function openTransferOverviewModal(ngbModalService: NgbModal) {
    ngbModalService.open(TransferOverviewModalComponent, {
        size: 'xl',
    });
}
