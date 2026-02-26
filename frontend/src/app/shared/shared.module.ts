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
import { HospitalNameComponent } from './components/hospital-name/hospital-name.component';
import { PatientStatusDataFieldComponent } from './components/patient-status-displayl/patient-status-data-field/patient-status-data-field.component';
import { PatientStatusDisplayComponent } from './components/patient-status-displayl/patient-status-display/patient-status-display.component';
import { TransferPointNameComponent } from './components/transfer-point-name/transfer-point-name.component';
import { ViewportNameComponent } from './components/viewport-name/viewport-name.component';
import { AppSaveOnTypingDirective } from './directives/app-save-on-typing.directive';
import { AutofocusDirective } from './directives/autofocus.directive';
import { FormatDurationPipe } from './pipes/format-duration.pipe';
import { KeysPipe } from './pipes/keys.pipe';
import { ValuesPipe } from './pipes/values.pipe';
import { DisplayValidationComponent } from './validation/display-validation/display-validation.component';
import { ExactMatchValidatorDirective } from './validation/exact-match-validator.directive';
import { ExerciseExistsValidatorDirective } from './validation/exercise-exists-validator.directive';
import { ImageExistsValidatorDirective } from './validation/image-exists-validator.directive';
import { IntegerValidatorDirective } from './validation/integer-validator.directive';
import { UrlValidatorDirective } from './validation/url-validator.directive';
import { PatientStatusBadgeComponent } from './components/patient-status-badge/patient-status-badge.component';
import { OrderByPipe } from './pipes/order-by.pipe';
import { FileInputDirective } from './directives/file-input.directive';
import { JoinIdDirective } from './validation/join-id-validator.directive';
import { CaterCapacityCountPipe } from './pipes/cater-capacity-count.pipe';
import { FooterComponent } from './components/footer/footer.component';
import { PatientHealthPointDisplayComponent } from './components/patient-health-point-display/patient-health-point-display.component';
import { PatientsDetailsComponent } from './components/patients-details/patients-details.component';
import { PatientStatusColorPipe } from './pipes/patient-status-color.pipe';
import { PatientStatusTagsFieldComponent } from './components/patient-status-displayl/patient-status-tags-field/patient-status-tags-field.component';
import { PatientBehaviorIconPipe } from './pipes/patient-behavior-icon.pipe';
import { PatientBehaviorDescriptionPipe } from './pipes/patient-behavior-description.pipe';
import { VehicleNameEditorComponent } from './components/vehicle-name-editor/vehicle-name-editor.component';
import { VehicleLoadUnloadControlsComponent } from './components/vehicle-load-unload-controls/vehicle-load-unload-controls.component';
import { VehicleAvailableSlotsDisplayComponent } from './components/vehicle-available-slots-display/vehicle-available-slots-display.component';
import { VehicleOccupationEditorComponent } from './components/vehicle-occupation-editor/vehicle-occupation-editor.component';
import { StartPauseButtonComponent } from './components/start-pause-button/start-pause-button.component';
import { GeographicCoordinateDirective } from './validation/geographic-coordinate-validator.directive';
import { SimulatedRegionNameComponent } from './components/simulated-region-name/simulated-region-name.component';
import { SearchableDropdownComponent } from './components/searchable-dropdown/searchable-dropdown.component';
import { PatientIdentifierComponent } from './components/patient-identifier/patient-identifier.component';
import { HotkeysService } from './services/hotkeys.service';
import { HotkeyIndicatorComponent } from './components/hotkey-indicator/hotkey-indicator.component';
import { PatientStatusDropdownComponent } from './components/patient-status-dropdown/patient-status-dropdown.component';
import { SendAlarmGroupInterfaceComponent } from './components/send-alarm-group-interface/send-alarm-group-interface.component';
import { OccupationNamePipe } from './pipes/occupation-name.pipe';
import { OccupationShortNamePipe } from './pipes/occupation-short-name.pipe';
import { SpecificRoleDisplayNamePipe } from './pipes/specific-role-display-name.pipe';
import { UserAccountNavbarItemComponent } from './components/user-account-navbar-item/user-account-navbar-item.component';
import { HeaderComponent } from './components/header/header.component';
import { ExerciseTemplateCardComponent } from './components/exercise-template-card/exercise-template-card.component';
import { ExerciseCardComponent } from './components/exercise-card/exercise-card.component';
import { InlineTextEditorComponent } from './components/inline-text-editor/inline-text-editor.component';
import { CopyButtonComponent } from './components/copy-button/copy-button.component';
import { PersonnelDetailsComponent } from './components/personnel-details/personnel-details.component';
import { CaterCapacityComponent } from './components/cater-capacity/cater-capacity.component';
import { PatientHeaderComponent } from './components/patient-header/patient-header.component';
import { MaterialDetailsComponent } from './components/material-details/material-details.component';

@NgModule({
    declarations: [
        UserAccountNavbarItemComponent,
        AutofocusDirective,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        ExactMatchValidatorDirective,
        JoinIdDirective,
        ExerciseExistsValidatorDirective,
        ImageExistsValidatorDirective,
        TransferPointNameComponent,
        PatientStatusDisplayComponent,
        HospitalNameComponent,
        FormatDurationPipe,
        UrlValidatorDirective,
        ValuesPipe,
        KeysPipe,
        OrderByPipe,
        ViewportNameComponent,
        IntegerValidatorDirective,
        PatientStatusDataFieldComponent,
        PatientStatusBadgeComponent,
        CaterCapacityCountPipe,
        CaterCapacityComponent,
        FileInputDirective,
        FooterComponent,
        HeaderComponent,
        PatientHealthPointDisplayComponent,
        PatientsDetailsComponent,
        PersonnelDetailsComponent,
        MaterialDetailsComponent,
        PatientHeaderComponent,
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
        SpecificRoleDisplayNamePipe,
        ExerciseCardComponent,
        ExerciseTemplateCardComponent,
        InlineTextEditorComponent,
        CopyButtonComponent,
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
        UserAccountNavbarItemComponent,
        SpecificRoleDisplayNamePipe,
        AutofocusDirective,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        ExactMatchValidatorDirective,
        CaterCapacityComponent,
        PatientHeaderComponent,
        JoinIdDirective,
        ExerciseExistsValidatorDirective,
        ImageExistsValidatorDirective,
        TransferPointNameComponent,
        PatientStatusDisplayComponent,
        HospitalNameComponent,
        FormatDurationPipe,
        UrlValidatorDirective,
        ValuesPipe,
        KeysPipe,
        OrderByPipe,
        CaterCapacityCountPipe,
        ViewportNameComponent,
        IntegerValidatorDirective,
        PatientStatusBadgeComponent,
        FileInputDirective,
        FooterComponent,
        HeaderComponent,
        PatientHealthPointDisplayComponent,
        PatientsDetailsComponent,
        PersonnelDetailsComponent,
        MaterialDetailsComponent,
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
        ExerciseCardComponent,
        ExerciseTemplateCardComponent,
        InlineTextEditorComponent,
        CopyButtonComponent,
    ],
    providers: [HotkeysService],
})
export class SharedModule {}
