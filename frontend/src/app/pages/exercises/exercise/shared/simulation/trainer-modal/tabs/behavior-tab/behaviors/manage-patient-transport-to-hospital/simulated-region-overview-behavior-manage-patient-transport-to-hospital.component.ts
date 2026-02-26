import { Component, input } from '@angular/core';
import type { UUID } from 'fuesim-digital-shared';

@Component({
    selector:
        'app-simulated-region-overview-behavior-manage-patient-transport-to-hospital',
    templateUrl:
        './simulated-region-overview-behavior-manage-patient-transport-to-hospital.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-manage-patient-transport-to-hospital.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorManagePatientTransportToHospitalComponent {
    readonly simulatedRegionId = input.required<UUID>();
    readonly behaviorId = input.required<UUID>();
}
