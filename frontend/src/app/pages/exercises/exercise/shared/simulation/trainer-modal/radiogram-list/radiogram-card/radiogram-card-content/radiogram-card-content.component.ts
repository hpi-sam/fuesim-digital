import { Component, input } from '@angular/core';
import type { ExerciseRadiogram } from 'fuesim-digital-shared';

@Component({
    selector: 'app-radiogram-card-content',
    templateUrl: './radiogram-card-content.component.html',
    styleUrls: ['./radiogram-card-content.component.scss'],
    standalone: false,
})
export class RadiogramCardContentComponent {
    readonly radiogram = input.required<ExerciseRadiogram>();
    readonly shownInSignallerModal = input(false);
}
