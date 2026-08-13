import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-connection-lost-modal',
    templateUrl: './connection-lost-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./connection-lost-modal.component.scss'],
})
export class ConnectionLostModalComponent {
    readonly activeModal = inject(NgbActiveModal);

    reload() {
        window.location.reload();
    }
}
