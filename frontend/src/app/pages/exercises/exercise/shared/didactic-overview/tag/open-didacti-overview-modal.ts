import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DidacticOverviewModalComponent } from '../didactic-overview-modal/didactic-overview-modal.component';

export function openDidacticOverviewModal(ngbModalService: NgbModal) {
    ngbModalService.open(DidacticOverviewModalComponent, { size: 'xl' });
}
