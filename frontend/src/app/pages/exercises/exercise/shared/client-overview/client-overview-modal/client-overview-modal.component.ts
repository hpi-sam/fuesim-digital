import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-client-overview-modal',
    templateUrl: './client-overview-modal.component.html',
    styleUrls: ['./client-overview-modal.component.scss'],
    standalone: false,
})
export class ClientOverviewModalComponent {
    activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
