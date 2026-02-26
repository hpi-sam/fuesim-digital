import { Component, input, output } from '@angular/core';
import type { PatientStatus } from 'fuesim-digital-shared';

@Component({
    selector: 'app-patient-status-dropdown',
    templateUrl: './patient-status-dropdown.component.html',
    styleUrls: ['./patient-status-dropdown.component.scss'],
    standalone: false,
})
export class PatientStatusDropdownComponent<
    AllowedStatus extends PatientStatus,
> {
    readonly patientStatus = input.required<AllowedStatus>();
    readonly allowedStatuses = input.required<readonly AllowedStatus[]>();
    readonly placement = input<'end' | 'start'>('start');
    readonly tabIndex = input(-1);

    readonly statusChanged = output<AllowedStatus>();
}
