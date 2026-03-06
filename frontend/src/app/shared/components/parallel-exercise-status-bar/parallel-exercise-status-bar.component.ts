import { Component, effect, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    GetParallelExerciseResponseData,
    ParallelExerciseInstanceSummary,
} from 'fuesim-digital-shared';
import { Router } from '@angular/router';
import type { AppState } from '../../../state/app.state';
import {
    selectClientNames,
    selectParticipantKey,
} from '../../../state/application/selectors/exercise.selectors';
import { ExerciseService } from '../../../core/exercise.service';
import { ApiService } from '../../../core/api.service';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service';

@Component({
    selector: 'app-parallel-exercise-status-bar',
    templateUrl: './parallel-exercise-status-bar.component.html',
    styleUrls: ['./parallel-exercise-status-bar.component.scss'],
    standalone: false,
})
export class ParallelExerciseStatusBarComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly apiService = inject(ApiService);
    protected readonly parallelExerciseService = inject(
        ParallelExerciseService
    );
    protected readonly exerciseService = inject(ExerciseService);
    private readonly router = inject(Router);

    public parallelExercise = signal<GetParallelExerciseResponseData | null>(
        null
    );

    public participantKey$ = this.store.select(selectParticipantKey);
    protected clientNames$ = this.store.select(selectClientNames);

    openExerciseInstance(exerciseInstance: ParallelExerciseInstanceSummary) {
        this.router.navigate(['/exercises', exerciseInstance.trainerKey]);
    }

    constructor() {
        effect(async () => {
            const parallelExerciseId =
                this.exerciseService.additionalExerciseMeta()
                    ?.parallelExerciseId;
            console.log('effect', parallelExerciseId);
            if (parallelExerciseId) {
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
