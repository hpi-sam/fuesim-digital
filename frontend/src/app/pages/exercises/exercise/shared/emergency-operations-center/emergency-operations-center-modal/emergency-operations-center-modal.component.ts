import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-emergency-operations-center-modal',
    templateUrl: './emergency-operations-center-modal.component.html',
    styleUrls: ['./emergency-operations-center-modal.component.scss'],
    standalone: false,
})
export class EmergencyOperationsCenterModalComponent {
    activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
