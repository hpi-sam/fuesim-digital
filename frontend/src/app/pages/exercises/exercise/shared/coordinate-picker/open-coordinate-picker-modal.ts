import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CoordinatePickerModalComponent } from './coordinate-picker-modal/coordinate-picker-modal.component';

export function openCoordinatePickerModal(ngbModalService: NgbModal) {
    ngbModalService.open(CoordinatePickerModalComponent, {
        size: 'sm',
    });
}
