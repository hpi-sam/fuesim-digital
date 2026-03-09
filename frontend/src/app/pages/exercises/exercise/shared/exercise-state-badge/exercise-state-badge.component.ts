import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from '../../../../../state/app.state';
import {
    selectExerciseStatus,
    selectCurrentTime,
} from '../../../../../state/application/selectors/exercise.selectors';

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
