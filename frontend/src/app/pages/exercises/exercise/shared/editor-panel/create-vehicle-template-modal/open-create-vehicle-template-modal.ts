import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateVehicleTemplateModalComponent } from './create-vehicle-template-modal.component';

export async function openCreateVehicleTemplateModal(
    ngbModalService: NgbModal
) {
    ngbModalService.open(CreateVehicleTemplateModalComponent, { size: 'lg' });
}
