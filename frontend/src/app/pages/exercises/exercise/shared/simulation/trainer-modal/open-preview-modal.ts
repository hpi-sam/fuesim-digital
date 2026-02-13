import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { SimulatedRegionPreviewComponent } from './preview/simulated-region-preview.component';

export function openPreviewModal(
    ngbModalService: NgbModal,
    simulatedRegionId?: UUID
) {
    const modalRef = ngbModalService.open(SimulatedRegionPreviewComponent, {
        size: 'xxl',
    });

    if (simulatedRegionId) {
        (
            modalRef.componentInstance as SimulatedRegionPreviewComponent
        ).simulatedRegionId = simulatedRegionId;
    }
}
