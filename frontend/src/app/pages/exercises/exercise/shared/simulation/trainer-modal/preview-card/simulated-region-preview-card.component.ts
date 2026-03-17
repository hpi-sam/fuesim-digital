import { Component, input, output } from '@angular/core';
import { Patient, UUID } from 'fuesim-digital-shared';

@Component({
    selector: 'app-simulated-region-preview-card',
    templateUrl: './simulated-region-preview-card.component.html',
    styleUrls: ['./simulated-region-preview-card.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewCardComponent {
    readonly elementMousedown = output<MouseEvent>();

    dataCy = input<string>('');
    title = input.required<string>();
    imageUrl = input.required<string>();
    darkBackground = input(false);
    patient = input<Patient>();
}
