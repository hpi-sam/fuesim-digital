import { Component, computed, effect, inject } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import {
    GetParallelExerciseResponseData,
    PatchParallelExerciseRequestData,
} from 'fuesim-digital-shared';
import { ActivatedRoute } from '@angular/router';
import { QrCodeComponent } from 'ng-qrcode';
import { ApiService } from '../../../core/api.service';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service';
import { shareLink } from '../../../shared/functions/share';
import { MessageService } from '../../../core/messages/message.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseStateBadgeInnerComponent } from '../../../shared/components/exercise-state-badge-inner/exercise-state-badge-inner.component';
import { ParallelExerciseInstanceRowComponent } from '../instance-row/parallel-exercise-instance-row.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { InlineTextEditorComponent } from '../../../shared/components/inline-text-editor/inline-text-editor.component';

@Component({
    selector: 'app-parallel-exercise',
    templateUrl: './parallel-exercise.component.html',
    styleUrls: ['./parallel-exercise.component.scss'],
    imports: [
        HeaderComponent,
        ExerciseStateBadgeInnerComponent,
        QrCodeComponent,
        ParallelExerciseInstanceRowComponent,
        FooterComponent,
        NgbTooltip,
        InlineTextEditorComponent,
    ],
})
export class ParallelExerciseComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly route = inject(ActivatedRoute);
    public readonly parallelExerciseService = inject(ParallelExerciseService);
    private readonly messageService = inject(MessageService);

    parallelExercise: HttpResourceRef<
        GetParallelExerciseResponseData | undefined
    >;
    readonly participantUrl = computed(
        () =>
            `${location.origin}/exercises/parallel/join/${this.parallelExercise.value()?.participantKey}`
    );

    shareParticipantLink() {
        shareLink(this.participantUrl(), this.messageService);
    }

    async patchParallelExercise(data: PatchParallelExerciseRequestData) {
        const parallelExercise = this.parallelExercise.value();
        if (!parallelExercise) return;
        await this.apiService.patchParallelExercise(parallelExercise.id, data);
        this.parallelExercise.reload();
    }

    constructor() {
        this.parallelExercise = this.apiService.getParallelExerciseResource(
            this.route.snapshot.params['id']
        );

        effect(async () => {
            const parallelExercise = this.parallelExercise.value();
            if (parallelExercise) {
                await this.parallelExerciseService.joinParallelExercise(
                    parallelExercise.id
                );
            }
        });
    }
}
