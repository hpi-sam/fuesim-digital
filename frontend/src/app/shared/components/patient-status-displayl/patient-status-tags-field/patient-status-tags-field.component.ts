import type { OnChanges } from '@angular/core';
import { PatientTag } from 'fuesim-digital-shared';
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-patient-status-tags-field',
    templateUrl: './patient-status-tags-field.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./patient-status-tags-field.component.scss'],
})
export class PatientStatusTagsFieldComponent implements OnChanges {
    readonly patientStatusTagsField = input.required<readonly PatientTag[]>();
    isPregnant!: boolean;

    ngOnChanges(): void {
        this.isPregnant = this.patientStatusTagsField().includes('P');
    }
}
