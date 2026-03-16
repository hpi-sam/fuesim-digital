import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientOverviewTableComponent } from '../client-overview-table/client-overview-table.component';

@Component({
    selector: 'app-client-overview-modal',
    templateUrl: './client-overview-modal.component.html',
    styleUrls: ['./client-overview-modal.component.scss'],
    imports: [ClientOverviewTableComponent],
})
export class ClientOverviewModalComponent {
    activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
