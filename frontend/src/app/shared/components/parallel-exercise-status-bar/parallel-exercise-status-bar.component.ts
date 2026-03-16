import { Component, effect, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    GetParallelExerciseResponseData,
    ParallelExerciseInstanceSummary,
} from 'fuesim-digital-shared';
import { Router, RouterLink } from '@angular/router';
import {
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
} from '@ng-bootstrap/ng-bootstrap';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import {
    selectClientNames,
    selectParticipantKey,
} from '../../../state/application/selectors/exercise.selectors';
import { ExerciseService } from '../../../core/exercise.service';
import { ApiService } from '../../../core/api.service';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { OlMapManagerService } from '../../../pages/exercises/exercise/shared/exercise-map/utility/ol-map-manager.service';
import { ExerciseStateBadgeComponent } from '../exercise-state-badge/exercise-state-badge.component';

@Component({
    selector: 'app-parallel-exercise-status-bar',
    templateUrl: './parallel-exercise-status-bar.component.html',
    styleUrls: ['./parallel-exercise-status-bar.component.scss'],
    imports: [
        RouterLink,
        ExerciseStateBadgeComponent,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownItem,
        AsyncPipe,
    ],
})
export class ParallelExerciseStatusBarComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly apiService = inject(ApiService);
    protected readonly parallelExerciseService = inject(
        ParallelExerciseService
    );
    protected readonly exerciseService = inject(ExerciseService);
    private readonly router = inject(Router);
    private readonly olMapManagerService = inject(OlMapManagerService);

    public readonly parallelExercise =
        signal<GetParallelExerciseResponseData | null>(null);

    public participantKey$ = this.store.select(selectParticipantKey);
    protected clientNames$ = this.store.select(selectClientNames);

    openExerciseInstance(exerciseInstance: ParallelExerciseInstanceSummary) {
        this.router.navigate(['/exercises', exerciseInstance.trainerKey], {
            queryParams:
                this.olMapManagerService.olMapManager?.getCoordinatesAsQueryParams(),
        });
    }

    constructor() {
        effect(async () => {
            const parallelExerciseId =
                this.exerciseService.additionalExerciseMeta()
                    ?.parallelExerciseId;
            console.log('effect', parallelExerciseId);
            if (
                parallelExerciseId &&
                selectStateSnapshot(selectCurrentMainRole, this.store) ===
                    'trainer'
            ) {
                this.parallelExercise.set(
                    await this.apiService.getParallelExercise(
                        parallelExerciseId
                    )
                );
                await this.parallelExerciseService.joinParallelExercise(
                    parallelExerciseId
                );
            }
        });
    }
}
