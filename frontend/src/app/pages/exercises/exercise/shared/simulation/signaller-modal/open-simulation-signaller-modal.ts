import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SignallerModalComponent } from './signaller-modal/signaller-modal.component';

export function openSimulationSignallerModal(ngbModalService: NgbModal) {
    ngbModalService.open(SignallerModalComponent, {
        fullscreen: true,
        keyboard: false,
    });
}
