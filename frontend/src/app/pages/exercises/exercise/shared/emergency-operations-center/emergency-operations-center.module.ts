import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
    NgbCollapseModule,
    NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { EmergencyOperationsCenterModalComponent } from './emergency-operations-center-modal/emergency-operations-center-modal.component';
import { EocLogInterfaceComponent } from './eoc-log-interface/eoc-log-interface.component';

@NgModule({
    declarations: [
        EmergencyOperationsCenterModalComponent,
        EocLogInterfaceComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NgbDropdownModule,
        NgbCollapseModule,
    ],
})
export class EmergencyOperationsCenterModule {}
