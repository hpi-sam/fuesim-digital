import { Component, input, output } from '@angular/core';
import { Patient } from 'fuesim-digital-shared';
import { PatientHealthPointDisplayComponent } from '../../../../../../../shared/components/patient-health-point-display/patient-health-point-display.component';
import { PatientStatusBadgeComponent } from '../../../../../../../shared/components/patient-status-badge/patient-status-badge.component';

@Component({
    selector: 'app-simulated-region-preview-card',
    templateUrl: './simulated-region-preview-card.component.html',
    styleUrls: ['./simulated-region-preview-card.component.scss'],
    imports: [PatientHealthPointDisplayComponent, PatientStatusBadgeComponent],
})
export class SimulatedRegionPreviewCardComponent {
    readonly elementMousedown = output<MouseEvent>();

    readonly dataCy = input<string>('');
    readonly title = input.required<string>();
    readonly imageUrl = input.required<string>();
    readonly darkBackground = input(false);
    readonly patient = input<Patient>();
}
