import { Component, input } from '@angular/core';
import type { UUID } from 'fuesim-digital-shared';
import { ManagePatientTransportToHospitalStatusEditorComponent } from './shared/manage-patient-transport-to-hospital-status-editor/manage-patient-transport-to-hospital-status-editor.component';
import { ManagePatientTransportToHospitalRequestTargetEditorComponent } from './shared/manage-patient-transport-to-hospital-request-target-editor/manage-patient-transport-to-hospital-request-target-editor.component';
import { ManagePatientTransportToHospitalMaximumCategoryEditorComponent } from './shared/manage-patient-transport-to-hospital-maximum-category-editor/manage-patient-transport-to-hospital-maximum-category-editor.component';
import { ManagePatientTransportToHospitalManagedRegionsTableComponent } from './shared/manage-patient-transport-to-hospital-managed-regions-table/manage-patient-transport-to-hospital-managed-regions-table.component';
import { ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent } from './shared/manage-patient-transport-to-hospital-vehicles-for-categories-editor/manage-patient-transport-to-hospital-vehicles-for-categories-editor.component';
import { ManagePatientTransportToHospitalSettingsEditorComponent } from './shared/manage-patient-transport-to-hospital-settings-editor/manage-patient-transport-to-hospital-settings-editor.component';

@Component({
    selector:
        'app-simulated-region-overview-behavior-manage-patient-transport-to-hospital',
    templateUrl:
        './simulated-region-overview-behavior-manage-patient-transport-to-hospital.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-manage-patient-transport-to-hospital.component.scss',
    ],
    imports: [
        ManagePatientTransportToHospitalStatusEditorComponent,
        ManagePatientTransportToHospitalRequestTargetEditorComponent,
        ManagePatientTransportToHospitalMaximumCategoryEditorComponent,
        ManagePatientTransportToHospitalManagedRegionsTableComponent,
        ManagePatientTransportToHospitalVehiclesForCategoriesEditorComponent,
        ManagePatientTransportToHospitalSettingsEditorComponent,
    ],
})
export class SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent {
    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();
}
