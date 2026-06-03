import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TrainerOperationsTabletModalComponent } from './trainer-operations-tablet-modal.component';

export function openTrainerOperationsTabletModal(ngbModalService: NgbModal) {
    ngbModalService.open(TrainerOperationsTabletModalComponent, {
        size: 'xl',
    });
}
