import { Component, inject } from '@angular/core';
import type { GetExercisesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseCardComponent } from '../../../shared/components/exercise-card/exercise-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { HelpButtonComponent } from '../../../help-button/help-button.component.js';
import { ExerciseService } from '../../../core/exercise.service.js';
import { FileInputDirective } from '../../../shared/directives/file-input.directive.js';

@Component({
    selector: 'app-exercise-list',
    templateUrl: './exercise-list.component.html',
    styleUrls: ['./exercise-list.component.scss'],
    imports: [
        HeaderComponent,
        ExerciseCardComponent,
        FooterComponent,
        HelpButtonComponent,
        FileInputDirective,
    ],
})
export class ExerciseListComponent {
    private readonly apiService = inject(ApiService);
    private readonly exerciseService = inject(ExerciseService);

    exercises: HttpResourceRef<GetExercisesResponseData | undefined>;

    constructor() {
        const apiService = this.apiService;

        this.exercises = apiService.getExercisesResource();
    }

    async createExercise(fileList?: FileList) {
        this.exerciseService.createExercise(fileList, () => {
            this.exercises.reload();
        });
    }
}
