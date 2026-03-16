import { Component, input, output } from '@angular/core';
import { type Vehicle } from 'digital-fuesim-manv-shared';

@Component({
    // We need to do it this way, to avoid cdkDragDrop issues
    selector: 'app-vehicles-zone',
    standalone: false,
    templateUrl: './vehicles-zone.component.html',
    styleUrl: './vehicles-zone.component.scss',
})
export class VehiclesZoneComponent {
    public readonly vehicles = input<Vehicle[]>();
    public readonly vehicleDropped = output<string>();
}
