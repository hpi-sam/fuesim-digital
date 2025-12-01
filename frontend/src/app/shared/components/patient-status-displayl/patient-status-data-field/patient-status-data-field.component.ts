import { Component, Input } from '@angular/core';
import { PatientStatusDataField } from 'digital-fuesim-manv-shared';
import { rgbColorPalette } from 'src/app/shared/functions/colors';

@Component({
    selector: 'app-patient-status-data-field',
    templateUrl: './patient-status-data-field.component.html',
    styleUrls: ['./patient-status-data-field.component.scss'],
    standalone: false,
})
export class PatientStatusDataFieldComponent {
    @Input() patientStatusDataField!: PatientStatusDataField;

    public get rgbColorPalette() {
        return rgbColorPalette;
    }
}
