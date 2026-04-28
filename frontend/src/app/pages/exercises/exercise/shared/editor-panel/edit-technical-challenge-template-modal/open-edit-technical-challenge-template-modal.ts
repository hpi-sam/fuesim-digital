import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { EditTechnicalChallengeTemplateModalComponent } from './edit-technical-challenge-template-modal.component.js';

export function openEditTechnicalChallengeTemplateModal(
    ngbModalService: NgbModal,
    vehicleTemplateId: UUID
) {
    const modalRef = ngbModalService.open(
        EditTechnicalChallengeTemplateModalComponent,
        {
            size: 'lg',
        }
    );
    const componentInstance =
        modalRef.componentInstance as EditTechnicalChallengeTemplateModalComponent;
    componentInstance.technicalChallengeTemplateId = vehicleTemplateId;
}
