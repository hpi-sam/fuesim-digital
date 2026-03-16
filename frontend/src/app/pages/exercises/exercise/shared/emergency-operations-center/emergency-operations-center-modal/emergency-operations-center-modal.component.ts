import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SendAlarmGroupsCardComponent } from '../send-alarm-groups-card/send-alarm-groups-card.component';
import { EocLogInterfaceComponent } from '../eoc-log-interface/eoc-log-interface.component';

@Component({
    selector: 'app-emergency-operations-center-modal',
    templateUrl: './emergency-operations-center-modal.component.html',
    styleUrls: ['./emergency-operations-center-modal.component.scss'],
    imports: [SendAlarmGroupsCardComponent, EocLogInterfaceComponent],
})
export class EmergencyOperationsCenterModalComponent {
    activeModal = inject(NgbActiveModal);

    public close() {
        this.activeModal.close();
    }
}
