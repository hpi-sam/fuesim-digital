import { Component, Input } from '@angular/core';
import { PatientStatusCode } from 'fuesim-digital-shared';

@Component({
    selector: 'app-patient-status-display',
    templateUrl: './patient-status-display.component.html',
    styleUrls: ['./patient-status-display.component.scss'],
    standalone: false,
})
export class PatientStatusDisplayComponent {
    @Input() patientStatus!: PatientStatusCode;
}
