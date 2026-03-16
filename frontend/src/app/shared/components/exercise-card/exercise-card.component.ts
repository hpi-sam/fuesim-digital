import { Component, computed, input, output, inject } from '@angular/core';
import type { GetExerciseResponseData } from 'fuesim-digital-shared';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

@Component({
    selector: 'app-exercise-card',
    templateUrl: './exercise-card.component.html',
    styleUrls: ['./exercise-card.component.scss'],
    imports: [CopyButtonComponent, RouterLink, DatePipe],
})
export class ExerciseCardComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    readonly exercise = input<GetExerciseResponseData>();
    readonly participantUrl = computed(
        () => `${location.origin}/exercises/${this.exercise()?.participantKey}`
    );
    readonly trainerUrl = computed(
        () => `${location.origin}/exercises/${this.exercise()?.trainerKey}`
    );
    readonly updated = output();

    async deleteExercise() {
        const trainerKey = this.exercise()?.trainerKey;
        if (!trainerKey) return;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Übung löschen',
            description:
                'Möchten Sie die Übung wirklich unwiederbringlich löschen?',
            confirmationString: trainerKey,
        });
        if (!deletionConfirmed) {
            return;
        }
        this.apiService.deleteExercise(trainerKey).then((response) => {
            this.messageService.postMessage({
                title: 'Übung erfolgreich gelöscht',
                color: 'success',
            });
            this.updated.emit();
        });
    }
}
