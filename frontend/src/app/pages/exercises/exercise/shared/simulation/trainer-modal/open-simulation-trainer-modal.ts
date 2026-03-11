import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { SimulatedRegionsModalComponent } from './simulated-regions-modal/simulated-regions-modal.component';

export function openSimulationTrainerModal(
    ngbModalService: NgbModal,
    simulatedRegionId?: UUID
) {
    const modalRef = ngbModalService.open(SimulatedRegionsModalComponent, {
        size: 'xxl',
    });

    if (simulatedRegionId) {
        (
            modalRef.componentInstance as SimulatedRegionsModalComponent
        ).currentSimulatedRegionId.set(simulatedRegionId);
    }
}
