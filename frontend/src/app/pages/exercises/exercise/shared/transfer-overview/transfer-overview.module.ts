import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TransferOverviewModalComponent } from './transfer-overview-modal/transfer-overview-modal.component.js';
import { TransferOverviewTableComponent } from './transfer-overview-table/transfer-overview-table.component.js';
import { TransferTargetInputComponent } from './transfer-target-input/transfer-target-input.component.js';
import { TransferTimeInputComponent } from './transfer-time-input/transfer-time-input.component.js';
import { StartPointNameComponent } from './start-point-name/start-point-name.component.js';

@NgModule({
    declarations: [
        TransferOverviewModalComponent,
        TransferOverviewTableComponent,
        TransferTargetInputComponent,
        TransferTimeInputComponent,
        StartPointNameComponent,
    ],
    imports: [CommonModule, SharedModule, NgbDropdownModule],
})
export class TransferOverviewModule {}
