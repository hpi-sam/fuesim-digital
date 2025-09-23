import { Component, Input } from '@angular/core';
import type { UUID } from 'digital-fuesim-manv-shared';

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
    @Input() simulatedRegionId!: UUID;
    @Input() behaviorId!: UUID;
}
