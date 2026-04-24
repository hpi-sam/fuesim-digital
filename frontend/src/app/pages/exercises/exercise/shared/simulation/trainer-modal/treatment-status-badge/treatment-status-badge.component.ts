import { Component, input } from '@angular/core';
import type { TreatmentProgress } from 'fuesim-digital-shared';
import { TreatmentProgressToGermanNamePipe } from '../tabs/behavior-tab/utils/treatment-progress-to-german-name.pipe';

@Component({
    selector: 'app-treatment-status-badge',
    templateUrl: './treatment-status-badge.component.html',
    styleUrls: ['./treatment-status-badge.component.scss'],
    imports: [TreatmentProgressToGermanNamePipe],
})
export class TreatmentStatusBadgeComponent {
    readonly treatmentProgress = input.required<TreatmentProgress>();
}
