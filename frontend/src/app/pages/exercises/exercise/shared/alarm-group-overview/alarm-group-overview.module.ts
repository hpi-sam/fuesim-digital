import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AlarmGroupOverviewModalComponent } from './alarm-group-overview-modal/alarm-group-overview-modal.component';
import { VehicleTemplateDisplayComponent } from './vehicle-template-display/vehicle-template-display.component';
import { AlarmGroupItemComponent } from './alarm-group-item/alarm-group-item.component';

@NgModule({
    declarations: [
        AlarmGroupOverviewModalComponent,
        VehicleTemplateDisplayComponent,
        AlarmGroupItemComponent,
    ],
    imports: [CommonModule, SharedModule, FormsModule, NgbDropdownModule],
})
export class AlarmGroupOverviewModule {}
