import { Component, inject } from '@angular/core';
import { NgbActiveModal, type NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TechnicalChallengeTemplate } from 'fuesim-digital-shared';
import { HelpButtonComponent } from '../../../../../../help-button/help-button.component.js';
import { ExerciseService } from '../../../../../../core/exercise.service.js';
import { MessageService } from '../../../../../../core/messages/message.service.js';
import { UploadTechnicalChallengeTemplateFormComponent } from '../upload-technical-challenge-template-form/upload-technical-challenge-template-form.component.js';

export function openUploadTechnicalChallengeModal(ngbModal: NgbModal) {
    ngbModal.open(UploadTechnicalChallengeTemplateModalComponent, {
        size: 'lg',
    });
}

@Component({
    selector: 'app-upload-technical-challenge-template-modal',
    imports: [
        HelpButtonComponent,
        UploadTechnicalChallengeTemplateFormComponent,
    ],
    templateUrl: './upload-technical-challenge-template-modal.component.html',
})
class UploadTechnicalChallengeTemplateModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly exerciseService = inject(ExerciseService);
    private readonly messageService = inject(MessageService);

    public async importTemplate(
        technicalChallengeTemplate: TechnicalChallengeTemplate
    ) {
        await this.exerciseService.proposeAction({
            type: '[TechnicalChallengeTemplate] Import a new template',
            technicalChallengeTemplate,
        });

        this.messageService.postMessage({
            title: 'Die technische Herausforderung wurde erfolgreich importiert.',
            color: 'success',
        });

        this.close();
    }

    public close(): void {
        this.activeModal.close();
    }
}
