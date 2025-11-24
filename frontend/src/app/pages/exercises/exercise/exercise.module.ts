import { CommonModule } from '@angular/common';
import {
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    NgbDropdownModule,
    NgbTooltipModule,
    NgbAccordionModule,
} from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { ExerciseComponent } from './exercise/exercise.component.js';
import { AlarmGroupOverviewModule } from './shared/alarm-group-overview/alarm-group-overview.module.js';
import { ClientOverviewModule } from './shared/client-overview/client-overview.module.js';
import { CreateImageTemplateModalComponent } from './shared/editor-panel/create-image-template-modal/create-image-template-modal.component.js';
import { CreateVehicleTemplateModalComponent } from './shared/editor-panel/create-vehicle-template-modal/create-vehicle-template-modal.component.js';
import { EditImageTemplateModalComponent } from './shared/editor-panel/edit-image-template-modal/edit-image-template-modal.component.js';
import { EditVehicleTemplateModalComponent } from './shared/editor-panel/edit-vehicle-template-modal/edit-vehicle-template-modal.component.js';
import { ImageTemplateFormComponent } from './shared/editor-panel/image-template-form/image-template-form.component.js';
import { VehicleTemplateFormComponent } from './shared/editor-panel/vehicle-template-form/vehicle-template-form.component.js';
import { EmergencyOperationsCenterModule } from './shared/emergency-operations-center/emergency-operations-center.module.js';
import { ExerciseMapModule } from './shared/exercise-map/exercise-map.module.js';
import { ExerciseSettingsModalComponent } from './shared/exercise-settings/exercise-settings-modal/exercise-settings-modal.component.js';
import { ExerciseStateBadgeComponent } from './shared/exercise-state-badge/exercise-state-badge.component.js';
import { ExerciseStatisticsModule } from './shared/exercise-statistics/exercise-statistics.module.js';
import { HospitalEditorModule } from './shared/hospital-editor/hospital-editor.module.js';
import { PartialExportModalComponent } from './shared/partial-export/partial-export-modal/partial-export-modal.component.js';
import { PartialImportModalComponent } from './shared/partial-import/partial-import-modal/partial-import-modal.component.js';
import { TimeTravelComponent } from './shared/time-travel/time-travel.component.js';
import { TrainerMapEditorComponent } from './shared/trainer-map-editor/trainer-map-editor.component.js';
import { TrainerToolbarComponent } from './shared/trainer-toolbar/trainer-toolbar.component.js';
import { TransferOverviewModule } from './shared/transfer-overview/transfer-overview.module.js';
import { CoordinatePickerModule } from './shared/coordinate-picker/coordinate-picker.module.js';
import { PersonnelTemplateDisplayComponent } from './shared/editor-panel/personnel-template-display/personnel-template-display.component.js';
import { MaterialTemplateDisplayComponent } from './shared/editor-panel/material-template-display/material-template-display.component.js';
import { MapEditorCardComponent } from './shared/editor-panel/map-editor-card/map-editor-card.component.js';

@NgModule({
    declarations: [
        ExerciseComponent,
        MapEditorCardComponent,
        TrainerMapEditorComponent,
        TrainerToolbarComponent,
        ExerciseStateBadgeComponent,
        ExerciseSettingsModalComponent,
        TimeTravelComponent,
        CreateImageTemplateModalComponent,
        CreateVehicleTemplateModalComponent,
        EditImageTemplateModalComponent,
        EditVehicleTemplateModalComponent,
        ImageTemplateFormComponent,
        VehicleTemplateFormComponent,
        PersonnelTemplateDisplayComponent,
        MaterialTemplateDisplayComponent,
        PartialExportModalComponent,
        PartialImportModalComponent,
    ],
    exports: [ExerciseComponent],
    imports: [
        CommonModule,
        SharedModule,
        NgbDropdownModule,
        FormsModule,
        ClientOverviewModule,
        ExerciseStatisticsModule,
        ExerciseMapModule,
        TransferOverviewModule,
        AlarmGroupOverviewModule,
        HospitalEditorModule,
        EmergencyOperationsCenterModule,
        CoordinatePickerModule,
        NgbTooltipModule,
        NgbAccordionModule,
    ],
    providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class ExerciseModule {}
