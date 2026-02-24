import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ExerciseService } from 'src/app/core/exercise.service';
import { AppState } from 'src/app/state/app.state';
import { selectVisibleVehicles } from 'src/app/state/application/selectors/shared.selectors';
import { map, zip } from 'rxjs';
import { selectVehiclesInTransfer } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicles-on-location',
    standalone: false,
    templateUrl: './vehicles-on-location.component.html',
    styleUrl: './vehicles-on-location.component.scss',
})
export class VehiclesOnLocationComponent {
    constructor(
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

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

    public vehicles$ = zip(
        this.visibleVehicles$,
        this.vehiclesInBetweenTransferpoints$
    ).pipe(
        map(([visibleVehicles, vehiclesInBetweenTransferpoints]) => {
            const data = [
                ...visibleVehicles,
                ...vehiclesInBetweenTransferpoints,
            ];
            data.sort((a, b) => a.name.localeCompare(b.name));
            return data;
        }),
        map((vehicles) =>
            vehicles.filter((vehicle) => vehicle.operationalAssignment === null)
        )
    );

    public onVehicleDropped(event: CdkDragDrop<string[]>) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: null,
                vehicleId: event.item.data,
                assignAsSectionLeader: false,
            },
            true
        );
    }
}
