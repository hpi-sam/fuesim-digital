import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { PartialExport } from 'fuesim-digital-shared';
import { preparePartialExportForImport } from 'fuesim-digital-shared';
import { ExerciseService } from '../../../../../../core/exercise.service';
import { MessageService } from '../../../../../../core/messages/message.service';

@Component({
    selector: 'app-partial-import-modal',
    templateUrl: './partial-import-modal.component.html',
    styleUrls: ['./partial-import-modal.component.scss'],
    standalone: false,
})
export class PartialImportModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly messageService = inject(MessageService);
    private readonly exerciseService = inject(ExerciseService);

    public importingPartialExport = false;

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
