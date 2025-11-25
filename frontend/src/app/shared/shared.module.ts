import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
    NgbDropdownModule,
    NgbNavModule,
    NgbPopover,
    NgbTooltip,
    NgbAccordionModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { QrCodeComponent } from 'ng-qrcode';
import { HospitalNameComponent } from './components/hospital-name/hospital-name.component.js';
import { PatientStatusDataFieldComponent } from './components/patient-status-displayl/patient-status-data-field/patient-status-data-field.component.js';
import { PatientStatusDisplayComponent } from './components/patient-status-displayl/patient-status-display/patient-status-display.component.js';
import { TransferPointNameComponent } from './components/transfer-point-name/transfer-point-name.component.js';
import { ViewportNameComponent } from './components/viewport-name/viewport-name.component.js';
import { AppSaveOnTypingDirective } from './directives/app-save-on-typing.directive.js';
import { AutofocusDirective } from './directives/autofocus.directive.js';
import { LetDirective } from './directives/let.directive.js';
import { FormatDurationPipe } from './pipes/format-duration.pipe.js';
import { KeysPipe } from './pipes/keys.pipe.js';
import { AppTrackByPropertyPipe } from './pipes/track-by-property/app-track-by-property.pipe.js';
import { ValuesPipe } from './pipes/values.pipe.js';
import { DisplayValidationComponent } from './validation/display-validation/display-validation.component.js';
import { ExactMatchValidatorDirective } from './validation/exact-match-validator.directive.js';
import { ExerciseExistsValidatorDirective } from './validation/exercise-exists-validator.directive.js';
import { ImageExistsValidatorDirective } from './validation/image-exists-validator.directive.js';
import { IntegerValidatorDirective } from './validation/integer-validator.directive.js';
import { UrlValidatorDirective } from './validation/url-validator.directive.js';
import { PatientStatusBadgeComponent } from './components/patient-status-badge/patient-status-badge.component.js';
import { OrderByPipe } from './pipes/order-by.pipe.js';
import { FileInputDirective } from './directives/file-input.directive.js';
import { JoinIdDirective } from './validation/join-id-validator.directive.js';
import { PersonnelNamePipe } from './pipes/personnel-name.pipe.js';
import { CaterCapacityCountPipe } from './pipes/cater-capacity-count.pipe.js';
import { FooterComponent } from './components/footer/footer.component.js';
import { PatientHealthPointDisplayComponent } from './components/patient-health-point-display/patient-health-point-display.component.js';
import { PatientsDetailsComponent } from './components/patients-details/patients-details.component.js';
import { PatientStatusColorPipe } from './pipes/patient-status-color.pipe.js';
import { PatientStatusTagsFieldComponent } from './components/patient-status-displayl/patient-status-tags-field/patient-status-tags-field.component.js';
import { PatientBehaviorIconPipe } from './pipes/patient-behavior-icon.pipe.js';
import { PatientBehaviorDescriptionPipe } from './pipes/patient-behavior-description.pipe.js';
import { VehicleNameEditorComponent } from './components/vehicle-name-editor/vehicle-name-editor.component.js';
import { VehicleLoadUnloadControlsComponent } from './components/vehicle-load-unload-controls/vehicle-load-unload-controls.component.js';
import { VehicleAvailableSlotsDisplayComponent } from './components/vehicle-available-slots-display/vehicle-available-slots-display.component.js';
import { VehicleOccupationEditorComponent } from './components/vehicle-occupation-editor/vehicle-occupation-editor.component.js';
import { StartPauseButtonComponent } from './components/start-pause-button/start-pause-button.component.js';
import { GeographicCoordinateDirective } from './validation/geographic-coordinate-validator.directive.js';
import { SimulatedRegionNameComponent } from './components/simulated-region-name/simulated-region-name.component.js';
import { SearchableDropdownComponent } from './components/searchable-dropdown/searchable-dropdown.component.js';
import { PatientIdentifierComponent } from './components/patient-identifier/patient-identifier.component.js';
import { HotkeysService } from './services/hotkeys.service.js';
import { HotkeyIndicatorComponent } from './components/hotkey-indicator/hotkey-indicator.component.js';
import { PatientStatusDropdownComponent } from './components/patient-status-dropdown/patient-status-dropdown.component.js';
import { SendAlarmGroupInterfaceComponent } from './components/send-alarm-group-interface/send-alarm-group-interface.component.js';
import { OccupationNamePipe } from './pipes/occupation-name.pipe.js';
import { OccupationShortNamePipe } from './pipes/occupation-short-name.pipe.js';

@NgModule({
    declarations: [
        AutofocusDirective,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        ExactMatchValidatorDirective,
        JoinIdDirective,
        AppTrackByPropertyPipe,
        ExerciseExistsValidatorDirective,
        ImageExistsValidatorDirective,
        TransferPointNameComponent,
        PatientStatusDisplayComponent,
        HospitalNameComponent,
        FormatDurationPipe,
        LetDirective,
        UrlValidatorDirective,
        ValuesPipe,
        KeysPipe,
        OrderByPipe,
        ViewportNameComponent,
        IntegerValidatorDirective,
        PatientStatusDataFieldComponent,
        PatientStatusBadgeComponent,
        PersonnelNamePipe,
        CaterCapacityCountPipe,
        FileInputDirective,
        FooterComponent,
        PatientHealthPointDisplayComponent,
        PatientsDetailsComponent,
        PatientStatusColorPipe,
        PatientStatusTagsFieldComponent,
        PatientBehaviorIconPipe,
        PatientBehaviorDescriptionPipe,
        VehicleNameEditorComponent,
        VehicleLoadUnloadControlsComponent,
        VehicleAvailableSlotsDisplayComponent,
        VehicleOccupationEditorComponent,
        StartPauseButtonComponent,
        SimulatedRegionNameComponent,
        GeographicCoordinateDirective,
        SearchableDropdownComponent,
        PatientIdentifierComponent,
        HotkeyIndicatorComponent,
        PatientStatusDropdownComponent,
        SendAlarmGroupInterfaceComponent,
        OccupationNamePipe,
        OccupationShortNamePipe,
    ],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        NgbDropdownModule,
        NgbNavModule,
        NgbTooltip,
        NgbAccordionModule,
        NgbPopover,
        QrCodeComponent,
    ],
    exports: [
        AutofocusDirective,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        ExactMatchValidatorDirective,
        JoinIdDirective,
        AppTrackByPropertyPipe,
        ExerciseExistsValidatorDirective,
        ImageExistsValidatorDirective,
        TransferPointNameComponent,
        PatientStatusDisplayComponent,
        HospitalNameComponent,
        FormatDurationPipe,
        LetDirective,
        UrlValidatorDirective,
        ValuesPipe,
        KeysPipe,
        OrderByPipe,
        PersonnelNamePipe,
        CaterCapacityCountPipe,
        ViewportNameComponent,
        IntegerValidatorDirective,
        PatientStatusBadgeComponent,
        FileInputDirective,
        FooterComponent,
        PatientHealthPointDisplayComponent,
        PatientsDetailsComponent,
        PatientStatusColorPipe,
        VehicleNameEditorComponent,
        VehicleLoadUnloadControlsComponent,
        VehicleAvailableSlotsDisplayComponent,
        VehicleOccupationEditorComponent,
        StartPauseButtonComponent,
        SimulatedRegionNameComponent,
        GeographicCoordinateDirective,
        SearchableDropdownComponent,
        PatientIdentifierComponent,
        HotkeyIndicatorComponent,
        PatientStatusDropdownComponent,
        SendAlarmGroupInterfaceComponent,
        OccupationNamePipe,
        OccupationShortNamePipe,
    ],
    providers: [HotkeysService],
})
export class SharedModule {}
