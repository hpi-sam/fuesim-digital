import { Component, inject } from '@angular/core';
import type { GetParallelExercisesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../../../core/api.service';

@Component({
    selector: 'app-parallel-exercise-list',
    templateUrl: './parallel-exercise-list.component.html',
    styleUrls: ['./parallel-exercise-list.component.scss'],
    standalone: false,
})
export class ParallelExerciseListComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);

    parallelExercises: HttpResourceRef<
        GetParallelExercisesResponseData | undefined
    >;

    constructor() {
        this.parallelExercises = this.apiService.getParallelExercisesResource();
    }
}
