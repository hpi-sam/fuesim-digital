import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { OperationsTabletViewComponent } from '../operations-tablet-view.component';

@Component({
    selector: 'app-trainer-operations-tablet-modal',
    imports: [OperationsTabletViewComponent],
    templateUrl: './trainer-operations-tablet-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './trainer-operations-tablet-modal.component.scss',
})
export class TrainerOperationsTabletModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
