import { Component } from '@angular/core';
import type { ExerciseTemplates } from 'digital-fuesim-manv-shared';
import { ApiService } from 'src/app/core/api.service';
import { HttpResourceRef } from '@angular/common/http';

@Component({
    selector: 'app-exercise-template-list',
    templateUrl: './exercise-template-list.component.html',
    styleUrls: ['./exercise-template-list.component.scss'],
    standalone: false,
})
export class ExerciseTemplateListComponent {
    exerciseTemplates: HttpResourceRef<ExerciseTemplates | undefined>;

    constructor(private readonly apiService: ApiService) {
        this.exerciseTemplates = apiService.getExerciseTemplatesResource();
    }
}
