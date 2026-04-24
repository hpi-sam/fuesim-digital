import { Component, input } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { type PatientStatusDataField } from 'fuesim-digital-shared';
import { rgbColorPalette } from '../../../functions/colors';
import { PatientStatusColorPipe } from '../../../pipes/patient-status-color.pipe';
import { PatientBehaviorIconPipe } from '../../../pipes/patient-behavior-icon.pipe';
import { PatientBehaviorDescriptionPipe } from '../../../pipes/patient-behavior-description.pipe';

@Component({
    selector: 'app-patient-status-data-field',
    templateUrl: './patient-status-data-field.component.html',
    styleUrls: ['./patient-status-data-field.component.scss'],
    imports: [
        NgClass,
        NgStyle,
        NgbTooltip,
        PatientStatusColorPipe,
        PatientBehaviorIconPipe,
        PatientBehaviorDescriptionPipe,
    ],
})
export class PatientStatusDataFieldComponent {
    readonly patientStatusDataField = input.required<PatientStatusDataField>();

    public get rgbColorPalette() {
        return rgbColorPalette;
    }
}
