import type { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import type { UUID } from 'fuesim-digital-shared';
import { EditTechnicalChallengeTemplateModalComponent } from './edit-technical-challenge-template-modal.component.js';

export async function openEditTechnicalChallengeTemplateModal(
    ngbModalService: NgbModal,
    technicalChallengeTemplate: UUID
) {
    const modalRef = ngbModalService.open(
        EditTechnicalChallengeTemplateModalComponent,
        {
            size: 'lg',
        }
    );
    const componentInstance =
        modalRef.componentInstance as EditTechnicalChallengeTemplateModalComponent;
    componentInstance.technicalChallengeTemplateId = technicalChallengeTemplate;
}
