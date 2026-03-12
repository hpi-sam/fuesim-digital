import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
    NgbCollapseModule,
    NgbDropdownModule,
    NgbNavModule,
    NgbPopoverModule,
    NgbProgressbarModule,
    NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';
import { TransferPointOverviewModule } from '../transfer-point-overview/transfer-point-overview.module';
import { SharedModule } from '../../../../../shared/shared.module';
import { SimulatedRegionOverviewGeneralComponent } from './trainer-modal/overview/simulated-region-overview.component';
import { SimulatedRegionPreviewComponent } from './trainer-modal/preview/simulated-region-preview.component';
import { SimulatedRegionPreviewCardComponent } from './trainer-modal/preview-card/simulated-region-preview-card.component';
import { SimulatedRegionOverviewBehaviorTabComponent } from './trainer-modal/tabs/behavior-tab/simulated-region-overview-behavior-tab.component';
import { SimulatedRegionOverviewGeneralTabComponent } from './trainer-modal/tabs/general-tab/simulated-region-overview-general-tab.component';
import { SimulatedRegionOverviewBehaviorTreatPatientsComponent } from './trainer-modal/tabs/behavior-tab/behaviors/treat-patients/simulated-region-overview-behavior-treat-patients.component';
import { SimulatedRegionOverviewBehaviorAssignLeaderComponent } from './trainer-modal/tabs/behavior-tab/behaviors/assign-leader/simulated-region-overview-behavior-assign-leader.component';
import { BehaviorTypeToGermanNamePipe } from './trainer-modal/tabs/behavior-tab/utils/behavior-to-german-name.pipe';
import { SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/unload-arriving-vehicles/simulated-region-overview-behavior-unload-arriving-vehicles.component';
import { TreatmentProgressToGermanNamePipe } from './trainer-modal/tabs/behavior-tab/utils/treatment-progress-to-german-name.pipe';
import { SimulatedRegionOverviewBehaviorTreatPatientsPatientDetailsComponent } from './trainer-modal/tabs/behavior-tab/behaviors/treat-patients/patient-details/simulated-region-overview-behavior-treat-patients-patient-details.component';
import { WithDollarPipe } from './trainer-modal/tabs/general-tab/utils/with-dollar';
import { SimulatedRegionsModalComponent } from './trainer-modal/simulated-regions-modal/simulated-regions-modal.component';
import { SimulatedRegionOverviewPatientsTabComponent } from './trainer-modal/tabs/patients-tab/tab/simulated-region-overview-patients-tab.component';
import { SelectPatientService } from './trainer-modal/select-patient.service';
import { RadiogramListComponent } from './trainer-modal/radiogram-list/radiogram-list.component';
import { RadiogramCardComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card.component';
import { RadiogramCardContentComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content/radiogram-card-content.component';
import { RadiogramCardContentFallbackComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-fallback/radiogram-card-content-fallback.component';
import { RadiogramCardContentMaterialCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-material-count/radiogram-card-content-material-count.component';
import { RadiogramCardContentTreatmentStatusComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-treatment-status/radiogram-card-content-treatment-status.component';
import { RadiogramCardContentPatientCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-patient-count/radiogram-card-content-patient-count.component';
import { RadiogramCardContentPersonnelCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-personnel-count/radiogram-card-content-personnel-count.component';
import { RadiogramCardContentVehicleCountComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-vehicle-count/radiogram-card-content-vehicle-count.component';
import { SimulatedRegionOverviewBehaviorReportComponent } from './trainer-modal/tabs/behavior-tab/behaviors/report/simulated-region-overview-behavior-report.component';
import { RadiogramCardContentInformationUnavailableComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-information-unavailable/radiogram-card-content-information-unavailable.component';
import { HumanReadableRadiogramTypePipe } from './trainer-modal/radiogram-list/human-readable-radiogram-type.pipe';
import { TreatmentStatusBadgeComponent } from './trainer-modal/treatment-status-badge/treatment-status-badge.component';
import { RadigoramCardContentMissingTransferConnectionComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-missing-transfer-connection/radiogram-card-content-missing-transfer-connection.component';
import { SimulatedRegionOverviewBehaviorProvidePersonnelComponent } from './trainer-modal/tabs/behavior-tab/behaviors/provide-personnel/simulated-region-overview-behavior-provide-personnel.component';
import { SimulatedRegionOverviewBehaviorAnswerVehicleRequestsComponent } from './trainer-modal/tabs/behavior-tab/behaviors/answer-vehicle-requests/simulated-region-overview-behavior-answer-vehicle-requests.component';
import { RadigoramCardContentResourceRequestComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-resource-request/radiogram-card-content-resource-request.component';
import { SimulatedRegionOverviewBehaviorAutomaticallyDistributeVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/automatically-distribute-vehicles/simulated-region-overview-behavior-automatically-distribute-vehicles.component';
import { RequestVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/request-vehicles/simulated-region-overview-behavior-request-vehicles.component';
import { SimulatedRegionOverviewPatientInteractionBarComponent } from './trainer-modal/tabs/patients-tab/interaction-bar/simulated-region-overview-patient-interaction-bar.component';
import { SimulatedRegionOverviewVehiclesTabComponent } from './trainer-modal/tabs/vehicles-tab/tab/simulated-region-overview-vehicles-tab.component';
import { SimulatedRegionOverviewPatientsTableComponent } from './trainer-modal/patients-table/simulated-region-overview-patients-table.component';
import { StartTransferService } from './trainer-modal/start-transfer.service';
import { SimulatedRegionOverviewBehaviorTransferVehiclesComponent } from './trainer-modal/tabs/behavior-tab/behaviors/transfer-vehicles/simulated-region-overview-behavior-transfer-vehicles.component';
import { RadiogramCardContentTransferCountsComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transfer-counts/radiogram-card-content-transfer-counts.component';
import { RadiogramCardContentTransferCategoryCompletedComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transfer-category-completed/radiogram-card-content-transfer-category-completed.component';
import { SimulatedRegionOverviewBehaviorTransferToHospitalComponent } from './trainer-modal/tabs/behavior-tab/behaviors/transfer-to-hospital/simulated-region-overview-behavior-transfer-to-hospital.component';
import { SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/simulated-region-overview-behavior-manage-patient-transport-to-hospital.component';
import { RadiogramCardContentTransportPatientCountRequestComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transport-patient-count-request/radiogram-card-content-transport-patient-count-request.component';
import { ManagePatientTransportToHospitalMaximumCategoryEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-maximum-category-editor/manage-patient-transport-to-hospital-maximum-category-editor.component';
import { ManagePatientTransportToHospitalStatusEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-status-editor/manage-patient-transport-to-hospital-status-editor.component';
import { ManagePatientTransportToHospitalRequestTargetEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-request-target-editor/manage-patient-transport-to-hospital-request-target-editor.component';
import { ManagePatientTransportToHospitalManagedRegionsTableComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-managed-regions-table/manage-patient-transport-to-hospital-managed-regions-table.component';
import { ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-vehicles-for-categories-editor/manage-patient-transport-to-hospital-vehicles-for-categories-editor.component';
import { ManagePatientTransportToHospitalSettingsEditorComponent } from './trainer-modal/tabs/behavior-tab/behaviors/manage-patient-transport-to-hospital/shared/manage-patient-transport-to-hospital-settings-editor/manage-patient-transport-to-hospital-settings-editor.component';
import { SignallerModalComponent } from './signaller-modal/signaller-modal/signaller-modal.component';
import { SignallerModalRegionSelectorComponent } from './signaller-modal/signaller-modal-region-selector/signaller-modal-region-selector.component';
import { SelectSignallerRegionService } from './signaller-modal/select-signaller-region.service';
import { SignallerModalRegionOverviewComponent } from './signaller-modal/signaller-modal-region/signaller-modal-region.component';
import { SignallerModalRegionLeaderComponent } from './signaller-modal/signaller-modal-region-leader/signaller-modal-region-leader.component';
import { SignallerModalRegionInformationComponent } from './signaller-modal/signaller-modal-region-information/signaller-modal-region-information.component';
import { SignallerModalRegionCommandsComponent } from './signaller-modal/signaller-modal-region-commands/signaller-modal-region-commands.component';
import { SignallerModalNoLeaderOverlayComponent } from './signaller-modal/signaller-modal-no-leader-overlay/signaller-modal-no-leader-overlay.component';
import { RadiogramCardContentTransferConnectionsComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-transfer-connections/radiogram-card-content-transfer-connections.component';
import { SignallerModalInteractionsComponent } from './signaller-modal/signaller-modal-interactions/signaller-modal-interactions.component';
import { SignallerModalRecurringReportModalComponent } from './signaller-modal/details-modal/signaller-modal-recurring-report-modal/signaller-modal-recurring-report-modal.component';
import { SimulationEventBasedReportEditorComponent } from './shared/simulation-event-based-report-editor/simulation-event-based-report-editor.component';
import { SignallerModalDetailsModalComponent } from './signaller-modal/details-modal/signaller-modal-details-modal/signaller-modal-details-modal.component';
import { SignallerModalDetailsService } from './signaller-modal/details-modal/signaller-modal-details.service';
import { SignallerModalEocComponent } from './signaller-modal/signaller-modal-eoc/signaller-modal-eoc.component';
import { SignallerModalStartTransferOfCategoryModalComponent } from './signaller-modal/details-modal/signaller-modal-start-transfer-of-category-modal/signaller-modal-start-transfer-of-category-modal.component';
import { SignallerModalTransportTraysEditorComponent } from './signaller-modal/details-modal/signaller-modal-transport-trays-editor/signaller-modal-transport-trays-editor.component';
import { SignallerModalProvideVehiclesEditorComponent } from './signaller-modal/details-modal/signaller-modal-provide-vehicles-editor/signaller-modal-provide-vehicles-editor.component';
import { SignallerModalRequestDestinationEditorComponent } from './signaller-modal/details-modal/signaller-modal-request-target-editor/signaller-modal-request-target-editor.component';
import { SignallerModalTransferConnectionsEditorComponent } from './signaller-modal/details-modal/signaller-modal-transfer-connections-editor/signaller-modal-transfer-connections-editor.component';
import { SignallerModalRegionsOverviewComponent } from './signaller-modal/signaller-modal-regions-overview/signaller-modal-regions-overview.component';
import { SignallerModalEocInformationAlarmGroupsSentComponent } from './signaller-modal/details-modal/eoc-information/signaller-modal-eoc-information-alarm-groups-sent/signaller-modal-eoc-information-alarm-groups-sent.component';
import { SignallerModalEocInformationArrivingVehiclesComponent } from './signaller-modal/details-modal/eoc-information/signaller-modal-eoc-information-arriving-vehicles/signaller-modal-eoc-information-arriving-vehicles.component';
import { RadiogramCardContentVehicleOccupationsComponent } from './trainer-modal/radiogram-list/radiogram-card/radiogram-card-content-vehicle-occupations/radiogram-card-content-vehicle-occupations.component';
import { SignallerModalTransportRequestTargetEditorComponent } from './signaller-modal/details-modal/signaller-modal-transport-request-target-editor/signaller-modal-transport-request-target-editor.component';
import { SimulatedRegionOverviewVehicleDetailsComponent } from './trainer-modal/tabs/vehicles-tab/details/simulated-region-overview-vehicle-details.component';
import { SimulatedRegionOverviewPatientDetailsComponent } from './trainer-modal/tabs/patients-tab/details/simulated-region-overview-patient-details.component';

@NgModule({
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
        SimulatedRegionOverviewGeneralComponent,
        SimulatedRegionOverviewBehaviorTabComponent,
        SimulatedRegionOverviewGeneralTabComponent,
        SimulatedRegionPreviewComponent,
        SimulatedRegionPreviewCardComponent,
        SimulatedRegionOverviewBehaviorTreatPatientsComponent,
        SimulatedRegionOverviewBehaviorAssignLeaderComponent,
        SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent,
        BehaviorTypeToGermanNamePipe,
        TreatmentProgressToGermanNamePipe,
        SimulatedRegionOverviewBehaviorTreatPatientsPatientDetailsComponent,
        WithDollarPipe,
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
        SimulatedRegionOverviewVehicleDetailsComponent,
        SimulatedRegionOverviewPatientDetailsComponent,
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
})
export class SimulationModalsModule {}
