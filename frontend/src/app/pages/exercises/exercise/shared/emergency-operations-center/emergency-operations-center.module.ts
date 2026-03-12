import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    NgbCollapseModule,
    NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';
import { EmergencyOperationsCenterModalComponent } from './emergency-operations-center-modal/emergency-operations-center-modal.component';
import { EocLogInterfaceComponent } from './eoc-log-interface/eoc-log-interface.component';
import { EmergencyOperationsCenterFullComponent } from './emergency-operations-center-full/emergency-operations-center-full.component';
import { SendAlarmGroupsCardComponent } from './send-alarm-groups-card/send-alarm-groups-card.component';

@NgModule({
    exports: [EmergencyOperationsCenterFullComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NgbDropdownModule,
        NgbCollapseModule,
        EmergencyOperationsCenterModalComponent,
        EmergencyOperationsCenterFullComponent,
        EocLogInterfaceComponent,
        SendAlarmGroupsCardComponent,
    ],
})
export class EmergencyOperationsCenterModule {}
