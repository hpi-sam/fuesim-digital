import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { PatientStatus } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-patient-status-dropdown',
    templateUrl: './patient-status-dropdown.component.html',
    styleUrls: ['./patient-status-dropdown.component.scss'],
    standalone: false,
})
export class PatientStatusDropdownComponent<
    AllowedStatus extends PatientStatus,
> {
    @Input() patientStatus!: AllowedStatus;
    @Input() allowedStatuses!: readonly AllowedStatus[];
    @Input() placement: 'end' | 'start' = 'start';
    @Input() tabIndex = -1;

    @Output() readonly statusChanged = new EventEmitter<AllowedStatus>();
}
