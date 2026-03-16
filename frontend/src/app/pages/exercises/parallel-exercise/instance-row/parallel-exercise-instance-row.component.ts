import { Component, computed, inject, input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ParallelExerciseInstanceSummary } from 'fuesim-digital-shared';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/api.service';
import { ParallelExerciseService } from '../../../../core/parallel-exercise.service';
import { MessageService } from '../../../../core/messages/message.service';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import { LogEntryComponent } from '../../exercise/shared/exercise-statistics/log-entry/log-entry.component';

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'tr[app-parallel-exercise-instance-row]',
    templateUrl: './parallel-exercise-instance-row.component.html',
    styleUrls: ['./parallel-exercise-instance-row.component.scss'],
    imports: [CopyButtonComponent, LogEntryComponent, RouterLink],
})
export class ParallelExerciseInstanceRowComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly route = inject(ActivatedRoute);
    public readonly parallelExerciseService = inject(ParallelExerciseService);
    private readonly messageService = inject(MessageService);

    readonly exerciseInstance = input<ParallelExerciseInstanceSummary>();
    readonly participantUrl = computed(
        () =>
            `${location.origin}/exercises/${this.exerciseInstance()?.participantKey}`
    );
}
