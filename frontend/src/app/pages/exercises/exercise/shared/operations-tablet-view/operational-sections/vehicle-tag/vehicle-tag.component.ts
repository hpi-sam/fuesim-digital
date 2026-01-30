import { Component, Input } from '@angular/core';
import { type Vehicle } from '../../../../../../../../../../shared/dist/models/vehicle';

@Component({
    selector: 'app-vehicle-tag',
    standalone: false,
    templateUrl: './vehicle-tag.component.html',
    styleUrl: './vehicle-tag.component.scss',
})
export class VehicleTagComponent {
    @Input()
    public vehicle!: Vehicle;
}
