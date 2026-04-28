import { Component, input } from '@angular/core';
import { Patient } from 'fuesim-digital-shared';
import { SimulatedRegionPreviewCardComponent } from '../simulated-region-preview-card.component';
import { PatientHealthPointDisplayComponent } from '../../../../../../../../shared/components/patient-health-point-display/patient-health-point-display.component';
import { PatientStatusBadgeComponent } from '../../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector: 'app-simulated-region-preview-patient-card',
    templateUrl: './simulated-region-preview-patient-card.component.html',
    styleUrls: ['./simulated-region-preview-patient-card.component.scss'],
    imports: [
        SimulatedRegionPreviewCardComponent,
        PatientHealthPointDisplayComponent,
        PatientStatusBadgeComponent,
    ],
})
export class SimulatedRegionPreviewPatientCardComponent extends SimulatedRegionPreviewCardComponent {
    readonly patient = input.required<Patient>();
}
