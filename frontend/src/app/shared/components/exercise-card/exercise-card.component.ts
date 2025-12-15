import { Component, computed, input } from '@angular/core';
import type { Exercise } from 'digital-fuesim-manv-shared';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import { selectExerciseId } from '../../../state/application/selectors/application.selectors';
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
    exercise = input<Exercise>();
    participantUrl = computed(
        () => `${location.origin}/exercises/${this.exercise()?.participantId}`
    );
    trainerUrl = computed(
        () => `${location.origin}/exercises/${this.exercise()?.trainerId}`
    );

    constructor(
        private readonly apiService: ApiService,
        private readonly messageService: MessageService,

        private readonly confirmationModalService: ConfirmationModalService
    ) {}

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
        // If we get disconnected by the server during the deletion a disconnect error would be displayed
        this.apiService.deleteExercise(exerciseId).then(
            (response) => {
                this.messageService.postMessage({
                    title: 'Übung erfolgreich gelöscht',
                    color: 'success',
                });
            },
            (error) => {
                this.messageService.postError({
                    title: 'Fehler beim Löschen der Übung',
                    error,
                });
            }
        );
    }
}
