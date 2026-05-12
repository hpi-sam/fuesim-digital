import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectVehiclesInSimulatedRegions,
    selectVehiclesInTransfer,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectVisibleVehicles } from '../../../../../../../state/application/selectors/shared.selectors';
import { OperationsVehicleItemComponent } from './operations-vehicle-item/operations-vehicle-item.component';

@Component({
    selector: 'app-operations-vehicles',
    templateUrl: './operations-vehicles.component.html',
    styleUrl: './operations-vehicles.component.scss',
    imports: [OperationsVehicleItemComponent],
})
export class OperationsVehiclesComponent {
    private readonly store = inject(Store<AppState>);

    private readonly visibleVehiclesMap = this.store.selectSignal(
        selectVisibleVehicles
    );
    private readonly visibleVehicles = computed(() =>
        Object.values(this.visibleVehiclesMap())
    );

    private readonly vehiclesInTransfer = this.store.selectSignal(
        selectVehiclesInTransfer
    );
    private readonly vehiclesInBetweenTransferpoints = computed(() =>
        Object.values(this.vehiclesInTransfer()).filter(
            (vehicle) =>
                vehicle.position.type === 'transfer' &&
                vehicle.position.transfer.startPoint.type ===
                    'transferStartPoint'
        )
    );

    private readonly vehiclesInSimulatedRegionMap = this.store.selectSignal(
        selectVehiclesInSimulatedRegions
    );
    private readonly vehiclesInSimulatedRegions = computed(() =>
        Object.values(this.vehiclesInSimulatedRegionMap())
    );

    public readonly vehiclesOnLocation = computed(() =>
        [
            ...this.visibleVehicles(),
            ...this.vehiclesInBetweenTransferpoints(),
            ...this.vehiclesInSimulatedRegions(),
        ].sort((a, b) => a.name.localeCompare(b.name))
    );

    public readonly alarmGroupVehiclesInTransfer = computed(() =>
        Object.values(this.vehiclesInTransfer()).filter(
            (vehicle) =>
                vehicle.position.type === 'transfer' &&
                vehicle.position.transfer.startPoint.type ===
                    'alarmGroupStartPoint'
        )
    );
}
