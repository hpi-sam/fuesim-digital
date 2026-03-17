import { Component, inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { selectVisibleVehicles } from '../../../../../../../state/application/selectors/shared.selectors';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectVehicles,
    selectVehiclesInTransfer,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { SectionLeaderSlotComponent } from '../section-leader-slot/section-leader-slot.component';
import { VehiclesZoneComponent } from '../vehicles-zone/vehicles-zone.component';
import { OperationsVehicleItemComponent } from '../../operation-details/operations-vehicles/operations-vehicle-item/operations-vehicle-item.component';

@Component({
    selector: 'app-local-operational-leader',
    templateUrl: './local-operational-leader.component.html',
    styleUrl: './local-operational-leader.component.scss',
    imports: [
        SectionLeaderSlotComponent,
        VehiclesZoneComponent,
        AsyncPipe,
        OperationsVehicleItemComponent,
    ],
})
export class LocalOperationalLeaderComponent {
    private readonly store = inject(Store<AppState>);
    private readonly exerciseService = inject(ExerciseService);

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

    public vehiclesFromAlarmgroups$ = this.store
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
