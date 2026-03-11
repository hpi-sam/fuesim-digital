import { Component, input } from '@angular/core';
import type { TreatmentProgress } from 'fuesim-digital-shared';

@Component({
    selector: 'app-treatment-status-badge',
    templateUrl: './treatment-status-badge.component.html',
    styleUrls: ['./treatment-status-badge.component.scss'],
    standalone: false,
})
export class TreatmentStatusBadgeComponent {
    readonly treatmentProgress = input.required<TreatmentProgress>();
}
