import { Component, input, output } from '@angular/core';
import type {
    ExerciseTemplate,
    ExerciseTemplateCreateData,
} from 'digital-fuesim-manv-shared';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';

@Component({
    selector: 'app-exercise-template-card',
    templateUrl: './exercise-template-card.component.html',
    styleUrls: ['./exercise-template-card.component.scss'],
    standalone: false,
})
export class ExerciseTemplateCardComponent {
    exerciseTemplate = input<ExerciseTemplate>();
    readonly updated = output();

    constructor(
        private readonly apiService: ApiService,
        private readonly messageService: MessageService,
        private readonly router: Router,
        private readonly confirmationModalService: ConfirmationModalService
    ) {}

    async patchExerciseTemplate(data: ExerciseTemplateCreateData) {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        await this.apiService.patchExerciseTemplate(exerciseTemplate.id, data);
    }

    createExercise() {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        this.apiService
            .createExerciseFromTemplate(exerciseTemplate.id)
            .then((ids) => {
                this.messageService.postMessage(
                    {
                        title: 'Übung erfolgreich erstellt',
                        body: '',
                        color: 'success',
                    },
                    'toast'
                );

                this.router.navigate(['/exercises', ids.trainerId]);
            });
    }

    async deleteExerciseTemplate() {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Übungsvorlage löschen',
            description:
                'Möchten Sie die Übungsvorlage wirklich unwiederbringlich löschen?',
            confirmationString: exerciseTemplate.trainerId,
        });
        if (!deletionConfirmed) {
            return;
        }
        this.apiService
            .deleteExerciseTemplate(exerciseTemplate.id)
            .then((response) => {
                this.messageService.postMessage({
                    title: 'Übungsvorlage erfolgreich gelöscht',
                    color: 'success',
                });
                this.updated.emit();
            });
    }
}
