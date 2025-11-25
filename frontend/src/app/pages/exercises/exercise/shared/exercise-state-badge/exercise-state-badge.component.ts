import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state.js';
import {
    selectCurrentTime,
    selectExerciseStatus,
} from 'src/app/state/application/selectors/exercise.selectors.js';

@Component({
    selector: 'app-exercise-state-badge',
    templateUrl: './exercise-state-badge.component.html',
    styleUrls: ['./exercise-state-badge.component.scss'],
    standalone: false,
})
export class ExerciseStateBadgeComponent {
    public readonly exerciseStatus$ = this.store.select(selectExerciseStatus);
    public readonly currentTime$ = this.store.select(selectCurrentTime);

    constructor(private readonly store: Store<AppState>) {}
}
