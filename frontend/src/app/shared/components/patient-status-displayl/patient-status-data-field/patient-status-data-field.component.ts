import { Component, input } from '@angular/core';
import { PatientStatusDataField } from 'fuesim-digital-shared';
import { rgbColorPalette } from '../../../functions/colors';

@Component({
    selector: 'app-patient-status-data-field',
    templateUrl: './patient-status-data-field.component.html',
    styleUrls: ['./patient-status-data-field.component.scss'],
    standalone: false,
})
export class PatientStatusDataFieldComponent {
    readonly patientStatusDataField = input.required<PatientStatusDataField>();

    public get rgbColorPalette() {
        return rgbColorPalette;
    }
}
