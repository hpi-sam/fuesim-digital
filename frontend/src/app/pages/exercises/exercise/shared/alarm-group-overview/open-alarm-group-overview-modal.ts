import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlarmGroupOverviewModalComponent } from './alarm-group-overview-modal/alarm-group-overview-modal.component';

export function openAlarmGroupOverviewModal(ngbModalService: NgbModal) {
    ngbModalService.open(AlarmGroupOverviewModalComponent, {
        size: 'xl',
    });
}
