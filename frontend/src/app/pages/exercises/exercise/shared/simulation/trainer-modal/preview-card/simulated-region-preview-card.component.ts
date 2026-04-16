import { Component, input, output } from '@angular/core';
import { Patient } from 'fuesim-digital-shared';

@Component({
    selector: 'app-simulated-region-preview-card',
    templateUrl: './simulated-region-preview-card.component.html',
    styleUrls: ['./simulated-region-preview-card.component.scss'],
})
export class SimulatedRegionPreviewCardComponent {
    readonly elementMousedown = output<MouseEvent>();

    readonly dataCy = input<string>('');
    readonly title = input.required<string>();
    readonly imageUrl = input.required<string>();
    readonly darkBackground = input(false);
    readonly patient = input<Patient>();
}
