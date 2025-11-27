import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmergencyOperationsCenterModalComponent } from './emergency-operations-center-modal/emergency-operations-center-modal.component';

export function openEmergencyOperationsCenterModal(ngbModalService: NgbModal) {
    ngbModalService.open(EmergencyOperationsCenterModalComponent, {
        size: 'lg',
    });
}
