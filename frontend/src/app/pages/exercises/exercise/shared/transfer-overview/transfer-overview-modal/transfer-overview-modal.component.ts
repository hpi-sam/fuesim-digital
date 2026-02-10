import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-transfer-overview-modal',
    templateUrl: './transfer-overview-modal.component.html',
    styleUrls: ['./transfer-overview-modal.component.scss'],
    standalone: false,
})
export class TransferOverviewModalComponent {
    activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
