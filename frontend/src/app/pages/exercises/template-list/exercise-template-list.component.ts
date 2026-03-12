import { Component, inject } from '@angular/core';
import type { GetExerciseTemplatesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { CreateExerciseTemplateModalComponent } from '../shared/create-exercise-template-modal/create-exercise-template-modal.component';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseTemplateCardComponent } from '../../../shared/components/exercise-template-card/exercise-template-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';

@Component({
    selector: 'app-exercise-template-list',
    templateUrl: './exercise-template-list.component.html',
    styleUrls: ['./exercise-template-list.component.scss'],
    imports: [HeaderComponent, ExerciseTemplateCardComponent, FooterComponent],
})
export class ExerciseTemplateListComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);

    exerciseTemplates: HttpResourceRef<
        GetExerciseTemplatesResponseData | undefined
    >;

    constructor() {
        const apiService = this.apiService;

        this.exerciseTemplates = apiService.getExerciseTemplatesResource();
    }

    async createExerciseTemplate() {
        const modalRef = this.ngbModalService.open(
            CreateExerciseTemplateModalComponent
        );
        const componentInstance =
            modalRef.componentInstance as CreateExerciseTemplateModalComponent;
        await firstValueFrom(componentInstance.exerciseTemplateCreated$, {
            defaultValue: false,
        });
        this.exerciseTemplates.reload();
    }
}
