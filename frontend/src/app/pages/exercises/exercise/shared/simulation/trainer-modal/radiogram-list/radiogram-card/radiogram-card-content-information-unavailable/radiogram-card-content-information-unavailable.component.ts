import { Component, input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';

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
    readonly radiogramType = input.required<ExerciseRadiogram['type']>();
}
