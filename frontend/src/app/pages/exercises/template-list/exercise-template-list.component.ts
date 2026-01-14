import { Component } from '@angular/core';
import type { ExerciseTemplates } from 'digital-fuesim-manv-shared';
import { ApiService } from 'src/app/core/api.service';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { CreateExerciseTemplateModalComponent } from '../shared/create-exercise-template-modal/create-exercise-template-modal.component';

@Component({
    selector: 'app-exercise-template-list',
    templateUrl: './exercise-template-list.component.html',
    styleUrls: ['./exercise-template-list.component.scss'],
    standalone: false,
})
export class ExerciseTemplateListComponent {
    exerciseTemplates: HttpResourceRef<ExerciseTemplates | undefined>;

    constructor(
        private readonly apiService: ApiService,
        private readonly ngbModalService: NgbModal
    ) {
        this.exerciseTemplates = apiService.getExerciseTemplatesResource();
    }

    createExerciseTemplate() {
        const modalRef = this.ngbModalService.open(
            CreateExerciseTemplateModalComponent
        );
        const componentInstance =
            modalRef.componentInstance as CreateExerciseTemplateModalComponent;
        firstValueFrom(componentInstance.exerciseTemplateCreated$, {
            defaultValue: false,
        }).then(() => {
            this.exerciseTemplates.reload();
        });
    }
}
