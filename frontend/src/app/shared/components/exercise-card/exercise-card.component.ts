import { Component, computed, input, output, inject } from '@angular/core';
import type { GetExerciseResponseData } from 'digital-fuesim-manv-shared';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-exercise-card',
    templateUrl: './exercise-card.component.html',
    styleUrls: ['./exercise-card.component.scss'],
    standalone: false,
})
export class ExerciseCardComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    exercise = input<GetExerciseResponseData>();
    participantUrl = computed(
        () => `${location.origin}/exercises/${this.exercise()?.participantId}`
    );
    trainerUrl = computed(
        () => `${location.origin}/exercises/${this.exercise()?.trainerId}`
    );
    readonly updated = output();

    async deleteExercise() {
        const exerciseId = this.exercise()?.trainerId; // TODO exercise ID
        if (!exerciseId) return;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Übung löschen',
            description:
                'Möchten Sie die Übung wirklich unwiederbringlich löschen?',
            confirmationString: exerciseId,
        });
        if (!deletionConfirmed) {
            return;
        }
        this.apiService.deleteExercise(exerciseId).then((response) => {
            this.messageService.postMessage({
                title: 'Übung erfolgreich gelöscht',
                color: 'success',
            });
            this.updated.emit();
        });
    }
}
