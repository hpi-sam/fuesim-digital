import { Component, inject } from '@angular/core';
import type { GetExerciseTemplatesResponseData } from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateExerciseTemplateModalComponent } from '../shared/create-exercise-template-modal/create-exercise-template-modal.component';
import { ApiService } from '../../../core/api.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { ExerciseTemplateCardComponent } from '../../../shared/components/exercise-template-card/exercise-template-card.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FileInputDirective } from '../../../shared/directives/file-input.directive';
import { MessageService } from '../../../core/messages/message.service';

@Component({
    selector: 'app-exercise-template-list',
    templateUrl: './exercise-template-list.component.html',
    styleUrls: ['./exercise-template-list.component.scss'],
    imports: [
        HeaderComponent,
        ExerciseTemplateCardComponent,
        FooterComponent,
        FileInputDirective,
    ],
})
export class ExerciseTemplateListComponent {
    private readonly apiService = inject(ApiService);
    private readonly ngbModalService = inject(NgbModal);
    private readonly messageService = inject(MessageService);

    exerciseTemplates: HttpResourceRef<
        GetExerciseTemplatesResponseData | undefined
    >;

    constructor() {
        const apiService = this.apiService;

        this.exerciseTemplates = apiService.getExerciseTemplatesResource();
    }

    async createExerciseTemplate(fileList?: FileList) {
        const modalRef = this.ngbModalService.open(
            CreateExerciseTemplateModalComponent
        );
        const componentInstance =
            modalRef.componentInstance as CreateExerciseTemplateModalComponent;
        componentInstance.created.subscribe((val) => {
            if (!val) return;
            this.exerciseTemplates.reload();
        });
        if (fileList) {
            await componentInstance.importFile(fileList);
        }
    }
}
