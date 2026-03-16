import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { AppState } from 'src/app/state/app.state';
import { selectVehiclesInTransfer } from 'src/app/state/application/selectors/exercise.selectors';
import { selectVisibleVehicles } from 'src/app/state/application/selectors/shared.selectors';

@Component({
    selector: 'app-operations-vehicles',
    standalone: false,
    templateUrl: './operations-vehicles.component.html',
    styleUrl: './operations-vehicles.component.scss',
})
export class OperationsVehiclesComponent {
    constructor(private readonly store: Store<AppState>) {}

    private readonly visibleVehicles$ = this.store
        .select(selectVisibleVehicles)
        .pipe(map((vehicles) => Object.values(vehicles)));
    private readonly vehiclesInBetweenTransferpoints$ = this.store
        .select(selectVehiclesInTransfer)
        .pipe(
            map((vehicles) =>
                Object.values(vehicles).filter(
                    (vehicle) =>
                        vehicle.position.type === 'transfer' &&
                        vehicle.position.transfer.startPoint.type ===
                            'transferStartPoint'
                )
            )
        );

    public vehiclesOnLocation$ = combineLatest([
        this.visibleVehicles$,
        this.vehiclesInBetweenTransferpoints$,
    ]).pipe(
        map(([visibleVehicles, vehiclesInBetweenTransferpoints]) => {
            const data = [
                ...visibleVehicles,
                ...vehiclesInBetweenTransferpoints,
            ];
            data.sort((a, b) => a.name.localeCompare(b.name));
            return data;
        })
    );

    public vehiclesInTransfer$ = this.store
        .select(selectVehiclesInTransfer)
        .pipe(
            map((vehicles) =>
                Object.values(vehicles).filter(
                    (vehicle) =>
                        vehicle.position.type === 'transfer' &&
                        vehicle.position.transfer.startPoint.type ===
                            'alarmGroupStartPoint'
                )
            )
        );
}
