import { Component, computed, inject } from '@angular/core';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GetParallelExerciseResponseData } from 'fuesim-digital-shared';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../../core/api.service';

@Component({
    selector: 'app-parallel-exercise',
    templateUrl: './parallel-exercise.component.html',
    styleUrls: ['./parallel-exercise.component.scss'],
    standalone: false,
})
export class ParallelExerciseComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly route = inject(ActivatedRoute);

    parallelExercise: HttpResourceRef<
        GetParallelExerciseResponseData | undefined
    >;
    participantUrl = computed(
        () =>
            `${location.origin}/exercises/parallel/join/${this.parallelExercise.value()?.participantKey}`
    );

    constructor() {
        this.parallelExercise = this.apiService.getParallelExerciseResource(
            this.route.snapshot.params['id']
        );
    }
}
