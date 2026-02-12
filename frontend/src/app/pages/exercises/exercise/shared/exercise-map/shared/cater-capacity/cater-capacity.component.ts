import { Input, Component } from '@angular/core';
import type { PatientStatus, CanCaterFor } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-cater-capacity',
    templateUrl: './cater-capacity.component.html',
    styleUrls: ['./cater-capacity.component.scss'],
    standalone: false,
})
export class CaterCapacityComponent {
    @Input() canCaterFor!: CanCaterFor;

    caterForStatuses: (PatientStatus & keyof CanCaterFor)[] = [
        'red',
        'yellow',
        'green',
    ];
}
