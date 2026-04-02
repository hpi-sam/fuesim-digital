import { Component } from '@angular/core';
import { OperationsMapComponent } from './operations-map/operations-map.component';
import { OperationsVehiclesComponent } from './operations-vehicles/operations-vehicles.component';

@Component({
    selector: 'app-operation-details-tab',
    templateUrl: './operation-details.component.html',
    styleUrl: './operation-details.component.scss',
    imports: [OperationsMapComponent, OperationsVehiclesComponent],
})
export class OperationDetailsTabComponent {}
