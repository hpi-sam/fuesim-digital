import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdownModule,
    NgbNavModule,
    NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { MessagesModule } from 'src/app/feature/messages/messages.module.js';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { TransferPointOverviewModule } from '../transfer-point-overview/transfer-point-overview.module.js';
import { SimulationModalsModule } from '../simulation/simulation-modals.module.js';
import { ExerciseMapComponent } from './exercise-map.component.js';
import { ChooseTransferTargetPopupComponent } from './shared/choose-transfer-target-popup/choose-transfer-target-popup.component.js';
import { MapImagePopupComponent } from './shared/map-image-popup/map-image-popup.component.js';
import { PatientPopupComponent } from './shared/patient-popup/patient-popup.component.js';
import { TransferPointPopupComponent } from './shared/transfer-point-popup/transfer-point-popup.component.js';
import { VehiclePopupComponent } from './shared/vehicle-popup/vehicle-popup.component.js';
import { ViewportPopupComponent } from './shared/viewport-popup/viewport-popup.component.js';
import { PersonnelPopupComponent } from './shared/personnel-popup/personnel-popup.component.js';
import { MaterialPopupComponent } from './shared/material-popup/material-popup.component.js';
import { CaterCapacityComponent } from './shared/cater-capacity/cater-capacity.component.js';
import { SimulatedRegionPopupComponent } from './shared/simulated-region-popup/simulated-region-popup.component.js';
import { PatientNameComponent } from './shared/patient-name/patient-name.component.js';

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
        CaterCapacityComponent,
        SimulatedRegionPopupComponent,
        PatientNameComponent,
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
    ],
})
export class ExerciseMapModule {}
