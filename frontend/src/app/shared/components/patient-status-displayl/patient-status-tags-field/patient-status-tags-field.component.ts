import type { OnChanges } from '@angular/core';
import { PatientTag } from 'fuesim-digital-shared';
import { Component, input } from '@angular/core';
import type { Immutable } from 'immer';

@Component({
    selector: 'app-patient-status-tags-field',
    templateUrl: './patient-status-tags-field.component.html',
    styleUrls: ['./patient-status-tags-field.component.scss'],
})
export class PatientStatusTagsFieldComponent implements OnChanges {
    readonly patientStatusTagsField = input.required<Immutable<PatientTag[]>>();
    isPregnant!: boolean;

    ngOnChanges(): void {
        this.isPregnant = this.patientStatusTagsField().includes('P');
    }
}
