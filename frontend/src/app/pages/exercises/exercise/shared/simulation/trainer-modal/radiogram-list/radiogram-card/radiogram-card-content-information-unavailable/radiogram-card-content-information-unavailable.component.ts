import { Component, input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';
import { HumanReadableRadiogramTypePipe } from '../../human-readable-radiogram-type.pipe';

@Component({
    selector: 'app-radiogram-card-content-information-unavailable',
    templateUrl:
        './radiogram-card-content-information-unavailable.component.html',
    styleUrls: [
        './radiogram-card-content-information-unavailable.component.scss',
    ],
    imports: [HumanReadableRadiogramTypePipe],
})
export class RadiogramCardContentInformationUnavailableComponent {
    readonly radiogramType = input.required<ExerciseRadiogram['type']>();
}
