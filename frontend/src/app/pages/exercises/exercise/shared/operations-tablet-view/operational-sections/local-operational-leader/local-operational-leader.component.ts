import { Component } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import {
    selectVehicles,
    selectVehiclesInTransfer,
} from 'src/app/state/application/selectors/exercise.selectors';
import { ExerciseService } from 'src/app/core/exercise.service';
import { combineLatest, map } from 'rxjs';
import { selectVisibleVehicles } from '../../../../../../../state/application/selectors/shared.selectors';

@Component({
    selector: 'app-local-operational-leader',
    standalone: false,
    templateUrl: './local-operational-leader.component.html',
    styleUrl: './local-operational-leader.component.scss',
})
export class LocalOperationalLeaderComponent {
    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService
    ) {}

    public localSectionLeader$ = this.store.select(
        createSelector(selectVehicles, (vehicles) =>
            Object.values(vehicles).find(
                (v) =>
                    v.operationalAssignment?.type === 'localOperationsCommand'
            )
        )
    );

    public onVehicleAssigned(vehicleId: string) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Assign Local Operations Command',
                vehicleId,
            },
            true
        );
    }

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

    public vehicles$ = combineLatest([
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
        }),
        map((vehicles) =>
            vehicles.filter((vehicle) => vehicle.operationalAssignment === null)
        )
    );

    public onVehicleDroppedUnassignment(vehicleId: string) {
        this.exerciseService.proposeAction(
            {
                type: '[OperationalSection] Move Vehicle To Operational Section',
                sectionId: null,
                vehicleId,
                assignAsSectionLeader: false,
            },
            true
        );
    }
}
