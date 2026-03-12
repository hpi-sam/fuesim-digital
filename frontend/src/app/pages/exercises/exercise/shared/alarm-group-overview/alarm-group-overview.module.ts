import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../../../../shared/shared.module';
import { AlarmGroupOverviewModalComponent } from './alarm-group-overview-modal/alarm-group-overview-modal.component';
import { VehicleTemplateDisplayComponent } from './vehicle-template-display/vehicle-template-display.component';
import { AlarmGroupItemComponent } from './alarm-group-item/alarm-group-item.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        NgbDropdownModule,
        AlarmGroupOverviewModalComponent,
        VehicleTemplateDisplayComponent,
        AlarmGroupItemComponent,
    ],
})
export class AlarmGroupOverviewModule {}
