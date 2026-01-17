import { Component, input } from '@angular/core';
import type {
    ExerciseTemplate,
    ExerciseTemplateCreateData,
} from 'digital-fuesim-manv-shared';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-exercise-template-card',
    templateUrl: './exercise-template-card.component.html',
    styleUrls: ['./exercise-template-card.component.scss'],
    standalone: false,
})
export class ExerciseTemplateCardComponent {
    exerciseTemplate = input<ExerciseTemplate>();

    constructor(
        private readonly apiService: ApiService,
        private readonly messageService: MessageService,
        private readonly router: Router
    ) {}

    patchExerciseTemplate(data: ExerciseTemplateCreateData) {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        this.apiService.patchExerciseTemplate(exerciseTemplate.id, data);
    }

    createExercise() {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        this.apiService
            .createExerciseFromTemplate(exerciseTemplate.id)
            .then((ids) => {
                // TODO use generic success handling
                this.messageService.postMessage(
                    {
                        title: 'Übung erstellt',
                        body: '',
                        color: 'success',
                    },
                    'toast'
                );
                this.router.navigate(['/exercises', ids.trainerId]);
            })
            // TODO use generic error handling
            .catch((error) => {
                this.messageService.postError({
                    title: 'Fehler beim Erstellen der Übung',
                    error: error.message,
                });
            });
    }
}
