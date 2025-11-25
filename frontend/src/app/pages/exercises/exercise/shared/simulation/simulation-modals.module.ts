import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module.js';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
    NgbCollapseModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbPopoverModule,
    NgbProgressbarModule,
    NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TransferPointOverviewModule } from '../transfer-point-overview/transfer-point-overview.module.js';
import { SimulatedRegionOverviewGeneralComponent } from './trainer-modal/overview/simulated-region-overview.component.js';
import { SimulatedRegionOverviewBehaviorTabComponent } from './trainer-modal/tabs/behavior-tab/simulated-region-overview-behavior-tab.component.js';
import { SimulatedRegionOverviewGeneralTabComponent } from './trainer-modal/tabs/general-tab/simulated-region-overview-general-tab.component.js';
import { SimulatedRegionOverviewBehaviorTreatPatientsComponent } from './trainer-modal/tabs/behavior-tab/behaviors/treat-patients/simulated-region-overview-behavior-treat-patients.component.js';
import { SimulatedRegionOverviewBehaviorAssignLeaderComponent } from './trainer-modal/tabs/behavior-tab/behaviors/assign-leader/simulated-region-overview-behavior-assign-leader.component.js';
import { BehaviorTypeToGermanNamePipe } from './trainer-modal/tabs/behavior-tab/utils/behavior-to-german-name.pipe.js';
import { SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/unload-arriving-vehicles/simulated-region-overview-behavior-unload-arriving-vehicles.component.js';
import { TreatmentProgressToGermanNamePipe } from './trainer-modal/tabs/behavior-tab/utils/treatment-progress-to-german-name.pipe.js';
import { SimulatedRegionOverviewBehaviorTreatPatientsPatientDetailsComponent } from './trainer-modal/tabs/behavior-tab/behaviors/treat-patients/patient-details/simulated-region-overview-behavior-treat-patients-patient-details.component.js';
import { WithDollarPipe } from './trainer-modal/tabs/general-tab/utils/with-dollar.js';
import { PersonnelTypeToGermanAbbreviationPipe } from './trainer-modal/tabs/behavior-tab/utils/personnel-type-to-german-abbreviation.pipe.js';
import { SimulatedRegionsModalComponent } from './trainer-modal/simulated-regions-modal/simulated-regions-modal.component.js';
import { SimulatedRegionOverviewPatientsTabComponent } from './trainer-modal/tabs/patients-tab/simulated-region-overview-patients-tab/simulated-region-overview-patients-tab.component.js';
import { SelectPatientService } from './trainer-modal/select-patient.service.js';
import { RadiogramListComponent } from './trainer-modal/radiogram-list/radiogram-list.component.js';
import { RadiogramCardComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card.component.js';
import { RadiogramCardContentComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content/radiogram-card-content.component.js';
import { RadiogramCardContentFallbackComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-fallback/radiogram-card-content-fallback.component.js';
import { RadiogramCardContentMaterialCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-material-count/radiogram-card-content-material-count.component.js';
import { RadiogramCardContentTreatmentStatusComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-treatment-status/radiogram-card-content-treatment-status.component.js';
import { RadiogramCardContentPatientCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-patient-count/radiogram-card-content-patient-count.component.js';
import { RadiogramCardContentPersonnelCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-personnel-count/radiogram-card-content-personnel-count.component.js';
import { RadiogramCardContentVehicleCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-vehicle-count/radiogram-card-content-vehicle-count.component.js';
import { SimulatedRegionOverviewBehaviorReportComponent } from './trainer-modal/tabs/behavior-tab/behaviors/report/simulated-region-overview-behavior-report.component.js';
import { RadiogramCardContentInformationUnavailableComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-information-unavailable/radiogram-card-content-information-unavailable.component.js';
import { HumanReadableRadiogramTypePipe } from './trainer-modal/radiogram-list/human-readable-radiogram-type.pipe.js';
import { TreatmentStatusBadgeComponent } from './trainer-modal/treatment-status-badge/treatment-status-badge.component.js';
import { RadigoramCardContentMissingTransferConnectionComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-missing-transfer-connection/radiogram-card-content-missing-transfer-connection.component.js';
import { SimulatedRegionOverviewBehaviorProvidePersonnelComponent } from './trainer-modal/tabs/behavior-tab/behaviors/provide-personnel/simulated-region-overview-behavior-provide-personnel.component.js';
import { SimulatedRegionOverviewBehaviorAnswerVehicleRequestsComponent } from './trainer-modal/tabs/behavior-tab/behaviors/answer-vehicle-requests/simulated-region-overview-behavior-answer-vehicle-requests.component.js';
import { RadigoramCardContentResourceRequestComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-resource-request/radiogram-card-content-resource-request.component.js';
import { SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/automatically-distribute-vehicles/simulated-region-overview-behavior-automatically-distribute-vehicles.component.js';
import { RequestVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/request-vehicles/simulated-region-overview-behavior-request-vehicles.component.js';
import { SimulatedRegionOverviewPatientInteractionBarComponent } from './trainer-modal/tabs/patients-tab/simulated-region-overview-patient-interaction-bar/simulated-region-overview-patient-interaction-bar.component.js';
import { SimulatedRegionOverviewVehiclesTabComponent } from './trainer-modal/tabs/vehicles-tab/simulated-region-overview-vehicles-tab.component.js';
import { SimulatedRegionOverviewPatientsTableComponent } from './trainer-modal/patients-table/simulated-region-overview-patients-table.component.js';
import { StartTransferService } from './trainer-modal/start-transfer.service.js';
import { SimulatedRegionOverviewBehaviorTransferVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/transfer-vehicles/simulated-region-overview-behavior-transfer-vehicles.component.js';
import { RadiogramCardContentTransferCountsComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transfer-counts/radiogram-card-content-transfer-counts.component.js';
import { RadiogramCardContentTransferCategoryCompletedComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transfer-category-completed/radiogram-card-content-transfer-category-completed.component.js';
import { SimulatedRegionOverviewBehaviorTransferToHospitalComponent } from './trainer-modal/tabs/behavior-tab/behaviors/transfer-to-hospital/simulated-region-overview-behavior-transfer-to-hospital.component.js';
import { SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/simulated-region-overview-behavior-manage-patient-transport-to-hospital.component.js';
import { RadiogramCardContentTransportPatientCountRequestComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transport-patient-count-request/radiogram-card-content-transport-patient-count-request.component.js';
import { ManagePatientTransportToHospitalMaximumCategoryEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-maximum-category-editor/manage-patient-transport-to-hospital-maximum-category-editor.component.js';
import { ManagePatientTransportToHospitalStatusEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-status-editor/manage-patient-transport-to-hospital-status-editor.component.js';
import { ManagePatientTransportToHospitalRequestTargetEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-request-target-editor/manage-patient-transport-to-hospital-request-target-editor.component.js';
import { ManagePatientTransportToHospitalManagedRegionsTableComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-managed-regions-table/manage-patient-transport-to-hospital-managed-regions-table.component.js';
import { ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-vehicles-for-categories-editor/manage-patient-transport-to-hospital-vehicles-for-categories-editor.component.js';
import { ManagePatientTransportToHospitalSettingsEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-settings-editor/manage-patient-transport-to-hospital-settings-editor.component.js';
import { SignallerModalComponent } from './signaller-modal/signaller-modal/signaller-modal.component.js';
import { SignallerModalRegionSelectorComponent } from './signaller-modal/signaller-modal-region-selector/signaller-modal-region-selector.component.js';
import { SelectSignallerRegionService } from './signaller-modal/select-signaller-region.service.js';
import { SignallerModalRegionOverviewComponent } from './signaller-modal/signaller-modal-region/signaller-modal-region.component.js';
import { SignallerModalRegionLeaderComponent } from './signaller-modal/signaller-modal-region-leader/signaller-modal-region-leader.component.js';
import { SignallerModalRegionInformationComponent } from './signaller-modal/signaller-modal-region-information/signaller-modal-region-information.component.js';
import { SignallerModalRegionCommandsComponent } from './signaller-modal/signaller-modal-region-commands/signaller-modal-region-commands.component.js';
import { SignallerModalNoLeaderOverlayComponent } from './signaller-modal/signaller-modal-no-leader-overlay/signaller-modal-no-leader-overlay.component.js';
import { RadiogramCardContentTransferConnectionsComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transfer-connections/radiogram-card-content-transfer-connections.component.js';
import { SignallerModalInteractionsComponent } from './signaller-modal/signaller-modal-interactions/signaller-modal-interactions.component.js';
import { SignallerModalRecurringReportModalComponent } from './signaller-modal/details-modal/signaller-modal-recurring-report-modal/signaller-modal-recurring-report-modal.component.js';
import { SimulationEventBasedReportEditorComponent } from './shared/simulation-event-based-report-editor/simulation-event-based-report-editor.component.js';
import { SignallerModalDetailsModalComponent } from './signaller-modal/details-modal/signaller-modal-details-modal/signaller-modal-details-modal.component.js';
import { SignallerModalDetailsService } from './signaller-modal/details-modal/signaller-modal-details.service.js';
import { SignallerModalEocComponent } from './signaller-modal/signaller-modal-eoc/signaller-modal-eoc.component.js';
import { SignallerModalStartTransferOfCategoryModalComponent } from './signaller-modal/details-modal/signaller-modal-start-transfer-of-category-modal/signaller-modal-start-transfer-of-category-modal.component.js';
import { SignallerModalTransportTraysEditorComponent } from './signaller-modal/details-modal/signaller-modal-transport-trays-editor/signaller-modal-transport-trays-editor.component.js';
import { SignallerModalProvideVehiclesEditorComponent } from './signaller-modal/details-modal/signaller-modal-provide-vehicles-editor/signaller-modal-provide-vehicles-editor.component.js';
import { SignallerModalRequestDestinationEditorComponent } from './signaller-modal/details-modal/signaller-modal-request-target-editor/signaller-modal-request-target-editor.component.js';
import { SignallerModalTransferConnectionsEditorComponent } from './signaller-modal/details-modal/signaller-modal-transfer-connections-editor/signaller-modal-transfer-connections-editor.component.js';
import { SignallerModalRegionsOverviewComponent } from './signaller-modal/signaller-modal-regions-overview/signaller-modal-regions-overview.component.js';
import { SignallerModalEocInformationAlarmGroupsSentComponent } from './signaller-modal/details-modal/eoc-information/signaller-modal-eoc-information-alarm-groups-sent/signaller-modal-eoc-information-alarm-groups-sent.component.js';
import { SignallerModalEocInformationArrivingVehiclesComponent } from './signaller-modal/details-modal/eoc-information/signaller-modal-eoc-information-arriving-vehicles/signaller-modal-eoc-information-arriving-vehicles.component.js';
import { RadiogramCardContentVehicleOccupationsComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-vehicle-occupations/radiogram-card-content-vehicle-occupations.component.js';
import { SignallerModalTransportRequestTargetEditorComponent } from './signaller-modal/details-modal/signaller-modal-transport-request-target-editor/signaller-modal-transport-request-target-editor.component.js';

@NgModule({
    declarations: [
        SimulatedRegionOverviewGeneralComponent,
        SimulatedRegionOverviewBehaviorTabComponent,
        SimulatedRegionOverviewGeneralTabComponent,
        SimulatedRegionOverviewBehaviorTreatPatientsComponent,
        SimulatedRegionOverviewBehaviorAssignLeaderComponent,
        SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent,
        BehaviorTypeToGermanNamePipe,
        TreatmentProgressToGermanNamePipe,
        SimulatedRegionOverviewBehaviorTreatPatientsPatientDetailsComponent,
        WithDollarPipe,
        PersonnelTypeToGermanAbbreviationPipe,
        SimulatedRegionsModalComponent,
        SimulatedRegionOverviewPatientsTabComponent,
        RadiogramListComponent,
        RadiogramCardComponent,
        RadiogramCardContentComponent,
        RadiogramCardContentFallbackComponent,
        RadiogramCardContentMaterialCountComponent,
        RadiogramCardContentTreatmentStatusComponent,
        RadiogramCardContentPatientCountComponent,
        RadiogramCardContentPersonnelCountComponent,
        RadiogramCardContentVehicleCountComponent,
        SimulatedRegionOverviewBehaviorReportComponent,
        RadiogramCardContentInformationUnavailableComponent,
        HumanReadableRadiogramTypePipe,
        TreatmentStatusBadgeComponent,
        RadigoramCardContentMissingTransferConnectionComponent,
        SimulatedRegionOverviewBehaviorProvidePersonnelComponent,
        SimulatedRegionOverviewBehaviorAnswerVehicleRequestsComponent,
        RadigoramCardContentResourceRequestComponent,
        SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent,
        RequestVehiclesComponent,
        SimulatedRegionOverviewPatientInteractionBarComponent,
        SimulatedRegionOverviewVehiclesTabComponent,
        SimulatedRegionOverviewPatientsTableComponent,
        SimulatedRegionOverviewBehaviorTransferVehiclesComponent,
        RadiogramCardContentTransferCountsComponent,
        RadiogramCardContentTransferCategoryCompletedComponent,
        SimulatedRegionOverviewBehaviorTransferToHospitalComponent,
        SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent,
        RadiogramCardContentTransportPatientCountRequestComponent,
        ManagePatientTransportToHospitalMaximumCategoryEditorComponent,
        ManagePatientTransportToHospitalStatusEditorComponent,
        ManagePatientTransportToHospitalRequestTargetEditorComponent,
        ManagePatientTransportToHospitalManagedRegionsTableComponent,
        ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent,
        ManagePatientTransportToHospitalSettingsEditorComponent,
        SignallerModalComponent,
        SignallerModalRegionSelectorComponent,
        SignallerModalRegionOverviewComponent,
        SignallerModalRegionLeaderComponent,
        SignallerModalRegionInformationComponent,
        SignallerModalRegionCommandsComponent,
        SignallerModalNoLeaderOverlayComponent,
        RadiogramCardContentTransferConnectionsComponent,
        SignallerModalInteractionsComponent,
        SignallerModalRecurringReportModalComponent,
        SimulationEventBasedReportEditorComponent,
        SignallerModalDetailsModalComponent,
        SignallerModalEocComponent,
        SignallerModalStartTransferOfCategoryModalComponent,
        SignallerModalTransportTraysEditorComponent,
        SignallerModalProvideVehiclesEditorComponent,
        SignallerModalRequestDestinationEditorComponent,
        SignallerModalTransportRequestTargetEditorComponent,
        SignallerModalTransferConnectionsEditorComponent,
        SignallerModalRegionsOverviewComponent,
        SignallerModalEocInformationAlarmGroupsSentComponent,
        SignallerModalEocInformationArrivingVehiclesComponent,
        RadiogramCardContentVehicleOccupationsComponent,
    ],
    exports: [SimulatedRegionOverviewGeneralComponent],
    providers: [
        SelectPatientService,
        StartTransferService,
        SelectSignallerRegionService,
        SignallerModalDetailsService,
    ],
    imports: [
        FormsModule,
        SharedModule,
        CommonModule,
        NgbNavModule,
        NgbCollapseModule,
        NgbDropdownModule,
        NgbProgressbarModule,
        NgbTooltipModule,
        NgbPopoverModule,
        DragDropModule,
        TransferPointOverviewModule,
    ],
})
export class SimulationModalsModule {}
