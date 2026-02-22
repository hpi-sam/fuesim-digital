import { Component, input } from '@angular/core';
import type { VehicleTemplate } from 'fuesim-digital-shared';

@Component({
    selector: 'app-vehicle-template-display',
    templateUrl: './vehicle-template-display.component.html',
    styleUrls: ['./vehicle-template-display.component.scss'],
})
export class VehicleTemplateDisplayComponent {
    public readonly vehicleTemplate = input.required<VehicleTemplate>();
}
