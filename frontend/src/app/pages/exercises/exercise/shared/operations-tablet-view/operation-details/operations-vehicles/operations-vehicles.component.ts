import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { AppState } from '../../../../../../../state/app.state';
import { selectVehiclesInTransfer } from '../../../../../../../state/application/selectors/exercise.selectors';
import { selectVisibleVehicles } from '../../../../../../../state/application/selectors/shared.selectors';
import { OperationsVehicleItemComponent } from './operations-vehicle-item/operations-vehicle-item.component';

@Component({
    selector: 'app-operations-vehicles',
    templateUrl: './operations-vehicles.component.html',
    styleUrl: './operations-vehicles.component.scss',
    imports: [OperationsVehicleItemComponent, AsyncPipe],
})
export class OperationsVehiclesComponent {
    private readonly store = inject(Store<AppState>);

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
