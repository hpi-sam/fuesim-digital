import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HospitalEditorModalComponent } from '../hospital-editor-page/hospital-editor-modal.component';

export function openHospitalEditorModal(ngbModalService: NgbModal) {
    ngbModalService.open(HospitalEditorModalComponent, {
        size: 'lg',
    });
}
