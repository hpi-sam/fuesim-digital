import { Component, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';

@Component({
    selector: 'app-eoc-log-entry-modal',
    templateUrl: './eoc-log-modal.component.html',
    styleUrls: ['./eoc-log-modal.component.scss'],
    imports: [FormsModule, AutofocusDirective],
})
export class EocLogModalComponent {
    activeModal = inject(NgbActiveModal);

    public readonly editable = signal<boolean>(true);
    public readonly message = signal<string>('');

    public initialize(message: string | null, editable: boolean = true) {
        if (message) {
            this.message.set(message);
        }
        this.editable.set(editable);
    }

    public confirm() {
        this.activeModal.close({
            message: this.message(),
        });
    }

    public cancel() {
        this.activeModal.dismiss();
    }
}
