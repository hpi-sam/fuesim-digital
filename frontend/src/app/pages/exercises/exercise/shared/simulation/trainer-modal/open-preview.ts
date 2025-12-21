import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'digital-fuesim-manv-shared';
import { SimulatedRegionPreviewComponent } from './preview/simulated-region-preview.component';

export function openPreview(
    ngbModalService: NgbModal,
    simulatedRegionId?: UUID
) {
    const modalRef = ngbModalService.open(SimulatedRegionPreviewComponent, {
        size: 'xl',
    });

    if (simulatedRegionId) {
        (
            modalRef.componentInstance as SimulatedRegionPreviewComponent
        ).simulatedRegionId = simulatedRegionId;
    }
}
