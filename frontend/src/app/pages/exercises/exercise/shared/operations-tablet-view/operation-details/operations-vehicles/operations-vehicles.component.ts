import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectVehiclesInTransfer,
    selectVehiclesOnOperationsLocation,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { OperationsVehicleItemComponent } from './operations-vehicle-item/operations-vehicle-item.component';

@Component({
    selector: 'app-operations-vehicles',
    templateUrl: './operations-vehicles.component.html',
    styleUrl: './operations-vehicles.component.scss',
    imports: [OperationsVehicleItemComponent],
})
export class OperationsVehiclesComponent {
    private readonly store = inject(Store<AppState>);

    private readonly vehiclesInTransfer = this.store.selectSignal(
        selectVehiclesInTransfer
    );

    public readonly vehiclesOnLocation = computed(() =>
        Object.values(this.store.selectSignal(
            selectVehiclesOnOperationsLocation
        )));

    public readonly alarmGroupVehiclesInTransfer = computed(() =>
        Object.values(this.vehiclesInTransfer()).filter(
            (vehicle) =>
                vehicle.position.type === 'transfer' &&
                vehicle.position.transfer.startPoint.type ===
                'alarmGroupStartPoint'
        )
    );
}
