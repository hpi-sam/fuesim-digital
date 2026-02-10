import type { OnChanges } from '@angular/core';
import { Component, Input } from '@angular/core';
import type { Tags } from 'fuesim-digital-shared';

@Component({
    selector: 'app-patient-status-tags-field',
    templateUrl: './patient-status-tags-field.component.html',
    styleUrls: ['./patient-status-tags-field.component.scss'],
    standalone: false,
})
export class PatientStatusTagsFieldComponent implements OnChanges {
    @Input() patientStatusTagsField!: Tags;
    isPregnant!: boolean;

    ngOnChanges(): void {
        this.isPregnant = this.patientStatusTagsField.includes('P');
    }
}
