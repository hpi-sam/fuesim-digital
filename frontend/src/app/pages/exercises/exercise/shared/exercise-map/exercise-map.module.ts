import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdownModule,
    NgbNavModule,
    NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TransferPointOverviewModule } from '../transfer-point-overview/transfer-point-overview.module';
import { SimulationModalsModule } from '../simulation/simulation-modals.module';
import { EmergencyOperationsCenterModule } from '../emergency-operations-center/emergency-operations-center.module';
import { MessagesModule } from '../../../../../feature/messages/messages.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { ExerciseMapComponent } from './exercise-map.component';
import { ChooseTransferTargetPopupComponent } from './shared/choose-transfer-target-popup/choose-transfer-target-popup.component';
import { MapImagePopupComponent } from './shared/map-image-popup/map-image-popup.component';
import { PatientPopupComponent } from './shared/patient-popup/patient-popup.component';
import { TransferPointPopupComponent } from './shared/transfer-point-popup/transfer-point-popup.component';
import { VehiclePopupComponent } from './shared/vehicle-popup/vehicle-popup.component';
import { ViewportPopupComponent } from './shared/viewport-popup/viewport-popup.component';
import { PersonnelPopupComponent } from './shared/personnel-popup/personnel-popup.component';
import { MaterialPopupComponent } from './shared/material-popup/material-popup.component';
import { SimulatedRegionPopupComponent } from './shared/simulated-region-popup/simulated-region-popup.component';
import { PatientNameComponent } from './shared/patient-name/patient-name.component';
import { RestrictedZonePopupComponent } from './shared/restricted-zone-popup/restricted-zone-popup.component';

@NgModule({
    declarations: [
        ExerciseMapComponent,
        VehiclePopupComponent,
        MapImagePopupComponent,
        PatientPopupComponent,
        TransferPointPopupComponent,
        ViewportPopupComponent,
        ChooseTransferTargetPopupComponent,
        PersonnelPopupComponent,
        MaterialPopupComponent,
        SimulatedRegionPopupComponent,
        PatientNameComponent,
        RestrictedZonePopupComponent,
    ],
    exports: [ExerciseMapComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        NgbDropdownModule,
        NgbNavModule,
        NgbTooltipModule,
        MessagesModule,
        SimulationModalsModule,
        TransferPointOverviewModule,
        EmergencyOperationsCenterModule,
    ],
})
export class ExerciseMapModule {}
