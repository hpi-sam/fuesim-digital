import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-partial-export-modal',
    templateUrl: './partial-export-modal.component.html',
    styleUrls: ['./partial-export-modal.component.scss'],
})
export class PartialExportModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
