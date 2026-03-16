import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TransferOverviewTableComponent } from '../transfer-overview-table/transfer-overview-table.component';

@Component({
    selector: 'app-transfer-overview-modal',
    templateUrl: './transfer-overview-modal.component.html',
    styleUrls: ['./transfer-overview-modal.component.scss'],
    imports: [TransferOverviewTableComponent],
})
export class TransferOverviewModalComponent {
    activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
