import { Component, input } from '@angular/core';
import type { PatientStatus, CanCaterFor } from 'fuesim-digital-shared';
import { PatientStatusBadgeComponent } from '../patient-status-badge/patient-status-badge.component';

@Component({
    selector: 'app-cater-capacity',
    templateUrl: './cater-capacity.component.html',
    styleUrls: ['./cater-capacity.component.scss'],
    imports: [PatientStatusBadgeComponent],
})
export class CaterCapacityComponent {
    readonly canCaterFor = input.required<CanCaterFor>();

    caterForStatuses: (PatientStatus & keyof CanCaterFor)[] = [
        'red',
        'yellow',
        'green',
    ];
}
