import { Component, Input } from '@angular/core';
import type { ExerciseRadiogram } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-radiogram-card-content-information-unavailable',
    templateUrl:
        './radiogram-card-content-information-unavailable.component.html',
    styleUrls: [
        './radiogram-card-content-information-unavailable.component.scss',
    ],
    standalone: false,
})
export class RadiogramCardContentInformationUnavailableComponent {
    @Input() radiogramType!: ExerciseRadiogram['type'];
}
