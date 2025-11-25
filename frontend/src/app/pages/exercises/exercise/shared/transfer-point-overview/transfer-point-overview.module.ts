import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdownModule,
    NgbPopoverModule,
} from '@ng-bootstrap/ng-bootstrap';
import { OtherTransferPointTabComponent } from './other-transfer-point-tab/other-transfer-point-tab.component.js';
import { TransferHospitalsTabComponent } from './transfer-hospitals-tab/transfer-hospitals-tab.component.js';

@NgModule({
    declarations: [
        OtherTransferPointTabComponent,
        TransferHospitalsTabComponent,
    ],
    imports: [
        CommonModule,
        SharedModule,
        FormsModule,
        NgbDropdownModule,
        NgbPopoverModule,
    ],
    exports: [OtherTransferPointTabComponent, TransferHospitalsTabComponent],
})
export class TransferPointOverviewModule {}
