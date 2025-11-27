import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { PartialExport } from 'digital-fuesim-manv-shared';
import { preparePartialExportForImport } from 'digital-fuesim-manv-shared';
import { ExerciseService } from 'src/app/core/exercise.service';
import { MessageService } from 'src/app/core/messages/message.service';

@Component({
    selector: 'app-partial-import-modal',
    templateUrl: './partial-import-modal.component.html',
    styleUrls: ['./partial-import-modal.component.scss'],
    standalone: false,
})
export class PartialImportModalComponent {
    public importingPartialExport = false;
    constructor(
        private readonly activeModal: NgbActiveModal,
        private readonly messageService: MessageService,
        private readonly exerciseService: ExerciseService
    ) {}

    public partialExport!: PartialExport;

    public close() {
        this.activeModal.close();
    }

    public async partialImportOverwrite(mode: 'append' | 'overwrite') {
        this.importingPartialExport = true;
        try {
            const result = await this.exerciseService.proposeAction({
                type: '[Exercise] Import Templates',
                mode,
                partialExport: preparePartialExportForImport(
                    this.partialExport
                ),
            });
            if (!result.success) {
                throw new Error((result as { message?: string }).message);
            }
            this.messageService.postMessage({
                title: 'Vorlagen erfolgreich importiert',
                color: 'success',
            });
            this.close();
        } catch (error: unknown) {
            this.messageService.postError({
                title: 'Fehler beim Importieren von Vorlagen',
                error,
            });
        } finally {
            this.importingPartialExport = false;
        }
    }
}
