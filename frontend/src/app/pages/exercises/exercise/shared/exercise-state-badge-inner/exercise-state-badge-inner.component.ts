import { Component, input } from '@angular/core';
import { ExerciseStatus } from 'fuesim-digital-shared';

@Component({
    selector: 'app-exercise-state-badge-inner',
    templateUrl: './exercise-state-badge-inner.component.html',
    styleUrls: ['./exercise-state-badge-inner.component.scss'],
    standalone: false,
})
export class ExerciseStateBadgeInnerComponent {
    public readonly exerciseStatus = input.required<ExerciseStatus>();
    public readonly currentTime = input.required<number>();
}
