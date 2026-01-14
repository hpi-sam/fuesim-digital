import { Component, input } from '@angular/core';
import type {
    ExerciseTemplate,
    ExerciseTemplateCreateData,
} from 'digital-fuesim-manv-shared';
import { ApplicationService } from '../../../core/application.service';
import { ApiService } from '../../../core/api.service';

@Component({
    selector: 'app-exercise-template-card',
    templateUrl: './exercise-template-card.component.html',
    styleUrls: ['./exercise-template-card.component.scss'],
    standalone: false,
})
export class ExerciseTemplateCardComponent {
    exerciseTemplate = input<ExerciseTemplate>();

    constructor(private readonly apiService: ApiService) {}

    patchExerciseTemplate(data: ExerciseTemplateCreateData) {
        const exerciseTemplate = this.exerciseTemplate();
        if (!exerciseTemplate) return;
        this.apiService.patchExerciseTemplate(exerciseTemplate.id, data);
    }
}
