import { Component, Input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import type { AppState } from 'src/app/state/app.state';

@Component({
    selector: 'app-simulated-region-preview-card',
    templateUrl: './simulated-region-preview-card.component.html',
    styleUrls: ['./simulated-region-preview-card.component.scss'],
    standalone: false,
})
export class SimulatedRegionPreviewCardComponent {
    constructor(private readonly store: Store<AppState>) {}

    readonly elementMousedown = output<MouseEvent>();

    @Input() dataCy = '';
    @Input() title!: string;
    @Input() imageUrl!: string;
    @Input() darkBackground = false;
}
