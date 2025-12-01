import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { OlMapManager } from '../exercise-map/utility/ol-map-manager';
import { CoordinatePickerModalComponent } from './coordinate-picker-modal/coordinate-picker-modal.component';

export function openCoordinatePickerModal(
    ngbModalService: NgbModal,
    olMapManager: OlMapManager
) {
    const modalRef = ngbModalService.open(CoordinatePickerModalComponent, {
        size: 'sm',
    });

    (
        modalRef.componentInstance as CoordinatePickerModalComponent
    ).olMapManager = olMapManager;
}
