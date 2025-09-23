import { Component, Input } from '@angular/core';
import type { TreatmentProgress } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-treatment-status-badge',
    templateUrl: './treatment-status-badge.component.html',
    styleUrls: ['./treatment-status-badge.component.scss'],
    standalone: false,
})
export class TreatmentStatusBadgeComponent {
    @Input() treatmentProgress!: TreatmentProgress;
}
