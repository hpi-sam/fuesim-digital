import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DidacticOverviewComponent } from '../didactic-overview.component';
@Component({
    selector: 'app-didactic-overview-modal',
    templateUrl: './didactic-overview-modal.component.html',
    styleUrls: ['./didactic-overview-modal.component.scss'],
    imports: [DidacticOverviewComponent],
})
export class DidacticOverviewModalComponent {
    private readonly activeModal = inject(NgbActiveModal);
    public close() {
        this.activeModal.close();
    }
}
