import { Component, inject } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { AppState } from '../../../../../../../state/app.state';
import {
    selectVehicles,
    selectVehiclesInTransfer,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import { SectionLeaderSlotComponent } from '../section-leader-slot/section-leader-slot.component';
import { OperationsVehicleItemComponent } from '../../operation-details/operations-vehicles/operations-vehicle-item/operations-vehicle-item.component';

@Component({
    selector: 'app-local-operational-leader',
    templateUrl: './local-operational-leader.component.html',
    styleUrl: './local-operational-leader.component.scss',
    imports: [
        SectionLeaderSlotComponent,
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
