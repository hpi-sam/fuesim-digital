import {
    Component,
    computed,
    inject,
    input,
    isDevMode,
    ChangeDetectionStrategy,
} from '@angular/core';
import { ExerciseStatus } from 'fuesim-digital-shared';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { SingleTickButtonComponent } from '../single-tick-button/single-tick-button.component';
import { selectExerciseStateMode } from '../../../state/application/selectors/application.selectors.js';
import type { AppState } from '../../../state/app.state.js';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors.js';

@Component({
    selector: 'app-exercise-state-badge-inner',
    templateUrl: './exercise-state-badge-inner.component.html',
    styleUrls: ['./exercise-state-badge-inner.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DatePipe, SingleTickButtonComponent],
})
export class ExerciseStateBadgeInnerComponent {
    private readonly store = inject<Store<AppState>>(Store);

    public readonly exerciseStatus = input.required<ExerciseStatus>();
    public readonly currentTime = input.required<number>();
    protected readonly showSingleTickButton = computed(
        () =>
            isDevMode() &&
            this.store.selectSignal(selectExerciseStateMode)() === 'exercise' &&
            this.store.selectSignal(selectCurrentMainRole)() === 'trainer'
    );
}
