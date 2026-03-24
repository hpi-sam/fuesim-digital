import { Component, input, isDevMode } from '@angular/core';
import { ExerciseStatus } from 'fuesim-digital-shared';
import { DatePipe } from '@angular/common';
import { SingleTickButtonComponent } from '../single-tick-button/single-tick-button.component';

@Component({
    selector: 'app-exercise-state-badge-inner',
    templateUrl: './exercise-state-badge-inner.component.html',
    styleUrls: ['./exercise-state-badge-inner.component.scss'],
    imports: [DatePipe, SingleTickButtonComponent],
})
export class ExerciseStateBadgeInnerComponent {
    public readonly exerciseStatus = input.required<ExerciseStatus>();
    public readonly currentTime = input.required<number>();
    protected readonly isDevMode = isDevMode;
}
