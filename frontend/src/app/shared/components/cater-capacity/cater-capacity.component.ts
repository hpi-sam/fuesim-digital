import { Component, input } from '@angular/core';
import type { PatientStatus, CanCaterFor } from 'fuesim-digital-shared';

@Component({
    selector: 'app-cater-capacity',
    templateUrl: './cater-capacity.component.html',
    styleUrls: ['./cater-capacity.component.scss'],
    standalone: false,
})
export class CaterCapacityComponent {
    readonly canCaterFor = input.required<CanCaterFor>();

    caterForStatuses: (PatientStatus & keyof CanCaterFor)[] = [
        'red',
        'yellow',
        'green',
    ];
}
