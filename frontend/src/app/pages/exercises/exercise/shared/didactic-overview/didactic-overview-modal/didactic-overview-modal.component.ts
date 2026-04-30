import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-didactic-overview',
    templateUrl: './didactic-overview-modal.component.html',
    styleUrls: ['./didactic-overview-modal.component.scss'],
    imports: [],
})
export class DidacticOverviewModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
