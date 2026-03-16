import { Component, input } from '@angular/core';
import { ExerciseStatus } from 'fuesim-digital-shared';
import { DatePipe } from '@angular/common';

@Component({
    selector: 'app-exercise-state-badge-inner',
    templateUrl: './exercise-state-badge-inner.component.html',
    styleUrls: ['./exercise-state-badge-inner.component.scss'],
    imports: [DatePipe],
})
export class ExerciseStateBadgeInnerComponent {
    public readonly exerciseStatus = input.required<ExerciseStatus>();
    public readonly currentTime = input.required<number>();
}
