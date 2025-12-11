import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-partial-export-modal',
    templateUrl: './partial-export-modal.component.html',
    styleUrls: ['./partial-export-modal.component.scss'],
    standalone: false,
})
export class PartialExportModalComponent {
    constructor(private readonly activeModal: NgbActiveModal) {}

    public close() {
        this.activeModal.close();
    }
}
