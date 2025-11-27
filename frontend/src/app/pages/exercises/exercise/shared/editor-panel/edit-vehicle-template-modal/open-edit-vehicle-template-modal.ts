import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'digital-fuesim-manv-shared';
import { EditVehicleTemplateModalComponent } from './edit-vehicle-template-modal.component';

export async function openEditVehicleTemplateModal(
    ngbModalService: NgbModal,
    vehicleTemplateId: UUID
) {
    const modalRef = ngbModalService.open(EditVehicleTemplateModalComponent, {
        size: 'lg',
    });
    const componentInstance =
        modalRef.componentInstance as EditVehicleTemplateModalComponent;
    componentInstance.vehicleTemplateId = vehicleTemplateId;
}
