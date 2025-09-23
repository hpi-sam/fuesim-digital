import { Component, Input } from '@angular/core';
import type { ExerciseRadiogram } from 'digital-fuesim-manv-shared';

@Component({
    selector: 'app-radiogram-card-content-fallback',
    templateUrl: './radiogram-card-content-fallback.component.html',
    styleUrls: ['./radiogram-card-content-fallback.component.scss'],
    standalone: false,
})
export class RadiogramCardContentFallbackComponent {
    @Input() radiogramType!: ExerciseRadiogram['type'];
}
