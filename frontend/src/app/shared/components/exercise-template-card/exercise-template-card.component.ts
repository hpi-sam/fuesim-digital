import { Component, input, output, inject } from '@angular/core';
import type {
    GetExerciseTemplateResponseData,
    PostExerciseTemplateRequestData,
} from 'fuesim-digital-shared';
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
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    exerciseTemplate = input<GetExerciseTemplateResponseData>();
    readonly updated = output();

    async patchExerciseTemplate(data: PostExerciseTemplateRequestData) {
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
                this.messageService.postMessage({
                    title: 'Übung erfolgreich erstellt',
                    body: '',
                    color: 'success',
                });

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
