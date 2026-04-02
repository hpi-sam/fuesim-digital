import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import type { AppState } from '../../../state/app.state';
import {
    selectExerciseStatus,
    selectCurrentTime,
} from '../../../state/application/selectors/exercise.selectors';
import { ExerciseStateBadgeInnerComponent } from '../exercise-state-badge-inner/exercise-state-badge-inner.component';

@Component({
    selector: 'app-exercise-state-badge',
    templateUrl: './exercise-state-badge.component.html',
    styleUrls: ['./exercise-state-badge.component.scss'],
    imports: [ExerciseStateBadgeInnerComponent],
})
export class ExerciseStateBadgeComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly exerciseStatus =
        this.store.selectSignal(selectExerciseStatus);
    public readonly currentTime = this.store.selectSignal(selectCurrentTime);
}
