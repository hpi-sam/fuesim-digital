import { Component, input } from '@angular/core';
import type { ExerciseTemplate } from 'digital-fuesim-manv-shared';
import { ApplicationService } from '../../../core/application.service';

@Component({
    selector: 'app-exercise-template-card',
    templateUrl: './exercise-template-card.component.html',
    styleUrls: ['./exercise-template-card.component.scss'],
    standalone: false,
})
export class ExerciseTemplateCardComponent {
    exerciseTemplate = input<ExerciseTemplate>();

    constructor(private readonly applicationService: ApplicationService) {}

    joinExercise() {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        this.applicationService.joinExercise(exerciseTemplate.trainerId, '');
    }
}
