import { Component, computed, input, output } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Vehicle } from 'fuesim-digital-shared';
import { VehicleTagComponent } from '../vehicle-tag/vehicle-tag.component';
import { ScrollButtonsComponent } from '../../../../../../../shared/components/scroll-buttons/scroll-buttons.component';

@Component({
    selector: 'app-vehicles-zone',
    templateUrl: './vehicles-zone.component.html',
    styleUrl: './vehicles-zone.component.scss',
    imports: [
        VehicleTagComponent,
        CdkDropList,
        CdkDrag,
        ScrollButtonsComponent,
    ],
})
export class VehiclesZoneComponent {
    public readonly vehicles = input<Vehicle[]>();
    public readonly vehicleDropped = output<{
        vehicleId: string;
        position: number;
    }>();

    public readonly mode = input<'x-scroll' | 'y-scroll'>('x-scroll');
    public readonly isX = computed(() => this.mode() === 'x-scroll');
    public readonly isY = computed(() => this.mode() === 'y-scroll');
}
