import { Component, Input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';

@Component({
    selector: 'app-radiogram-card-content',
    templateUrl: './radiogram-card-content.component.html',
    styleUrls: ['./radiogram-card-content.component.scss'],
    standalone: false,
})
export class RadiogramCardContentComponent {
    @Input() radiogram!: ExerciseRadiogram;
    @Input() shownInSignallerModal = false;
}
