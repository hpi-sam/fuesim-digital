import { Component, input } from '@angular/core';
import type { Exercise } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-exercise-card',
    templateUrl: './exercise-card.component.html',
    styleUrls: ['./exercise-card.component.scss'],
    standalone: false,
})
export class ExerciseCardComponent {
    exercise = input<Exercise>();
}
