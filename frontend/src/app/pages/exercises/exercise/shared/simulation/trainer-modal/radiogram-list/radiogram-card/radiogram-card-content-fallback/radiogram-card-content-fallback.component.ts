import { Component, input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';
import { HumanReadableRadiogramTypePipe } from '../../human-readable-radiogram-type.pipe';

@Component({
    selector: 'app-radiogram-card-content-fallback',
    templateUrl: './radiogram-card-content-fallback.component.html',
    styleUrls: ['./radiogram-card-content-fallback.component.scss'],
    imports: [HumanReadableRadiogramTypePipe],
})
export class RadiogramCardContentFallbackComponent {
    readonly radiogramType = input.required<ExerciseRadiogram['type']>();
}
