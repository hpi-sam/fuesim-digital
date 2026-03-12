import { Component } from '@angular/core';
import { SendAlarmGroupsCardComponent } from '../send-alarm-groups-card/send-alarm-groups-card.component';
import { EocLogInterfaceComponent } from '../eoc-log-interface/eoc-log-interface.component';

@Component({
    selector: 'app-emergency-operations-center-full',
    templateUrl: './emergency-operations-center-full.component.html',
    styleUrls: ['./emergency-operations-center-full.component.scss'],
    imports: [SendAlarmGroupsCardComponent, EocLogInterfaceComponent],
})
export class EmergencyOperationsCenterFullComponent {}
