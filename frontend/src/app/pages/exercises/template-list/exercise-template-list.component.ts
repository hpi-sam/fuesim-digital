import { Component, inject } from '@angular/core';
import type { GetExerciseTemplatesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseTemplateCardComponent } from '../../../shared/components/exercise-template-card/exercise-template-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FileInputDirective } from '../../../shared/directives/file-input.directive';
import { HelpButtonComponent } from '../../../help-button/help-button.component.js';
import { ExerciseService } from '../../../core/exercise.service.js';

@Component({
    selector: 'app-exercise-template-list',
    templateUrl: './exercise-template-list.component.html',
    styleUrls: ['./exercise-template-list.component.scss'],
    imports: [
        HeaderComponent,
        ExerciseTemplateCardComponent,
        FooterComponent,
        FileInputDirective,
        HelpButtonComponent,
    ],
})
export class ExerciseTemplateListComponent {
    private readonly apiService = inject(ApiService);
    private readonly exerciseService = inject(ExerciseService);

    exerciseTemplates: HttpResourceRef<
        GetExerciseTemplatesResponseData | undefined
    >;

    constructor() {
        this.exerciseTemplates = this.apiService.getExerciseTemplatesResource();
    }

    async createExerciseTemplate(fileList?: FileList) {
        await this.exerciseService.createExerciseTemplate(fileList);
        this.exerciseTemplates.reload();
    }
}
