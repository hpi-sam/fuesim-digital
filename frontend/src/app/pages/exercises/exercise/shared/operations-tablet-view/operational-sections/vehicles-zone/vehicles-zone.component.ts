import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Vehicle } from 'fuesim-digital-shared';
import { VehicleTagComponent } from '../vehicle-tag/vehicle-tag.component';

@Component({
    selector: 'app-vehicles-zone',
    templateUrl: './vehicles-zone.component.html',
    styleUrl: './vehicles-zone.component.scss',
    imports: [VehicleTagComponent, CdkDropList, CdkDrag],
})
export class VehiclesZoneComponent {
    public readonly vehicles = input<Vehicle[]>();
    public readonly vehicleDropped = output<string>();

    public entered() {
        console.log('entered');
    }
}
