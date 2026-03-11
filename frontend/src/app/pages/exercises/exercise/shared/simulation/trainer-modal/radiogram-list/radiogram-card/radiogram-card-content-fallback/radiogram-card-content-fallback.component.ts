import { Component, input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';

@Component({
    selector: 'app-radiogram-card-content-fallback',
    templateUrl: './radiogram-card-content-fallback.component.html',
    styleUrls: ['./radiogram-card-content-fallback.component.scss'],
    standalone: false,
})
export class RadiogramCardContentFallbackComponent {
    readonly radiogramType = input.required<ExerciseRadiogram['type']>();
}
