import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../../../../shared/shared.module';
import { TransferOverviewModalComponent } from './transfer-overview-modal/transfer-overview-modal.component';
import { TransferOverviewTableComponent } from './transfer-overview-table/transfer-overview-table.component';
import { TransferTargetInputComponent } from './transfer-target-input/transfer-target-input.component';
import { TransferTimeInputComponent } from './transfer-time-input/transfer-time-input.component';
import { StartPointNameComponent } from './start-point-name/start-point-name.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        NgbDropdownModule,
        TransferOverviewModalComponent,
        TransferOverviewTableComponent,
        TransferTargetInputComponent,
        TransferTimeInputComponent,
        StartPointNameComponent,
    ],
})
export class TransferOverviewModule {}
