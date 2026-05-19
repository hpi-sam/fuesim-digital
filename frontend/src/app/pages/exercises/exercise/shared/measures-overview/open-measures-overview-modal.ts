import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MeasuresOverviewModalComponent } from './measures-overview-modal/measures-overview-modal.component';

export function openMeasuresOverviewModal(ngbModalService: NgbModal) {
    ngbModalService.open(MeasuresOverviewModalComponent, {
        size: 'xl',
    });
}
