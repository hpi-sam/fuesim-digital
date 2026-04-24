import { Component, inject, signal } from '@angular/core';
import type {
    ExportImportFile,
    GetExerciseTemplatesResponseData,
} from 'fuesim-digital-shared';
import { HttpResourceRef } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
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
    public readonly importingExercise = signal(false);

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

    public async importExerciseTemplate(fileList: FileList) {
        this.importingExercise.set(true);
        try {
            const importString = await fileList.item(0)?.text();
            if (importString === undefined) return;
            const importPlain = JSON.parse(importString) as ExportImportFile;
            const type = importPlain.type;
            if (type !== 'complete') {
                this.messageService.postMessage({
                    color: 'danger',
                    title: 'Unerlaubter Importtyp',
                    body: 'Nur vollständige Übungsexporte können als neue Vorlage importiert werden.',
                });
                return;
            }
            await this.apiService.importExerciseTemplate(importPlain);
            this.exerciseTemplates.reload();

            this.messageService.postMessage({
                color: 'success',
                title: 'Übung erfolgreich als neue Vorlage importiert',
            });
        } catch (error: unknown) {
            this.messageService.postError({
                title: 'Fehler beim Importieren',
                error,
            });
        } finally {
            this.importingExercise.set(false);
        }
    }
}
