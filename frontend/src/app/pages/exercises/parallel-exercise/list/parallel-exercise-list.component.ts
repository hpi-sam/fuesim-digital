import { Component, inject } from '@angular/core';
import type { GetParallelExercisesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../../core/api.service';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ParallelExerciseCardComponent } from '../../../../shared/components/parallel-exercise-card/parallel-exercise-card.component';

@Component({
    selector: 'app-parallel-exercise-list',
    templateUrl: './parallel-exercise-list.component.html',
    styleUrls: ['./parallel-exercise-list.component.scss'],
    imports: [
        HeaderComponent,
        RouterLink,
        FooterComponent,
        ParallelExerciseCardComponent,
    ],
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
