import { Component, input } from '@angular/core';
import { PatientStatusCode } from 'fuesim-digital-shared';
import { PatientStatusDataFieldComponent } from '../patient-status-data-field/patient-status-data-field.component';
import { PatientStatusTagsFieldComponent } from '../patient-status-tags-field/patient-status-tags-field.component';

@Component({
    selector: 'app-patient-status-display',
    templateUrl: './patient-status-display.component.html',
    styleUrls: ['./patient-status-display.component.scss'],
    imports: [PatientStatusDataFieldComponent, PatientStatusTagsFieldComponent],
})
export class PatientStatusDisplayComponent {
    readonly patientStatus = input.required<PatientStatusCode>();
}
