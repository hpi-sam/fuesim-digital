import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state';
import {
    selectCurrentTime,
    selectExerciseStatus,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-exercise-state-badge',
    templateUrl: './exercise-state-badge.component.html',
    styleUrls: ['./exercise-state-badge.component.scss'],
    standalone: false,
})
export class ExerciseStateBadgeComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly exerciseStatus$ = this.store.select(selectExerciseStatus);
    public readonly currentTime$ = this.store.select(selectCurrentTime);
}
