import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationsTabletViewComponent } from '../operations-tablet-view.component';

@Component({
    selector: 'app-trainer-operations-tablet-modal',
    imports: [OperationsTabletViewComponent],
    templateUrl: './trainer-operations-tablet-modal.component.html',
    styleUrl: './trainer-operations-tablet-modal.component.scss',
})
export class TrainerOperationsTabletModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
