import { Component, computed, input, output, inject } from '@angular/core';
import type { GetParallelExerciseResponseData } from 'fuesim-digital-shared';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { ApiService } from '../../../core/api.service';
import { MessageService } from '../../../core/messages/message.service';
import { CopyButtonComponent } from '../copy-button/copy-button.component';

@Component({
    selector: 'app-parallel-exercise-card',
    templateUrl: './parallel-exercise-card.component.html',
    styleUrls: ['./parallel-exercise-card.component.scss'],
    imports: [CopyButtonComponent, RouterLink, DatePipe],
})
export class ParallelExerciseCardComponent {
    private readonly apiService = inject(ApiService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    readonly parallelExercise = input<GetParallelExerciseResponseData>();
    readonly participantUrl = computed(
        () =>
            `${location.origin}/exercises/${this.parallelExercise()?.participantKey}`
    );
    readonly updated = output();

    async deleteExercise() {
        const id = this.parallelExercise()?.id;
        if (!id) return;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Parallelübung löschen',
            description:
                'Möchten Sie die Parallelübung wirklich unwiederbringlich löschen?',
            confirmationString: this.parallelExercise()?.participantKey,
        });
        if (!deletionConfirmed) {
            return;
        }
        this.apiService.deleteParallelExercise(id).then((response) => {
            this.messageService.postMessage({
                title: 'Parallelübung erfolgreich gelöscht',
                color: 'success',
            });
            this.updated.emit();
        });
    }
}
