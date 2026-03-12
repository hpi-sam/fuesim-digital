import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdownModule,
    NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../../../../shared/shared.module';
import { OtherTransferPointTabComponent } from './other-transfer-point-tab/other-transfer-point-tab.component';
import { TransferHospitalsTabComponent } from './transfer-hospitals-tab/transfer-hospitals-tab.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        NgbDropdownModule,
        NgbPopoverModule,
        OtherTransferPointTabComponent,
        TransferHospitalsTabComponent,
    ],
    exports: [OtherTransferPointTabComponent, TransferHospitalsTabComponent],
})
export class TransferPointOverviewModule {}
