import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    UnloadArrivingVehiclesBehaviorState,
    UnloadVehicleActivityState,
} from 'digital-fuesim-manv-shared';
import type { UUID } from 'digital-fuesim-manv-shared';
import { StrictObject } from 'digital-fuesim-manv-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import {
    createSelectActivityStates,
    createSelectBehaviorState,
    selectCurrentTime,
    selectVehicles,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-simulated-region-overview-behavior-unload-arriving-vehicles',
    templateUrl:
        './simulated-region-overview-behavior-unload-arriving-vehicles.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-unload-arriving-vehicles.component.scss',
    ],
    standalone: false,
})
export class SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent
    implements OnInit
{
    @Input()
    simulatedRegionId!: UUID;

    @Input()
    behaviorId!: UUID;

    unloadDuration$?: Observable<number>;
    vehiclesStatus$?: Observable<VehicleUnloadStatus[]>;

    constructor(
        private readonly exerciseService: ExerciseService,
        public readonly store: Store<AppState>
    ) {}

    ngOnInit(): void {
        const selectBehavior =
            createSelectBehaviorState<UnloadArrivingVehiclesBehaviorState>(
                this.simulatedRegionId,
                this.behaviorId
            );
        this.unloadDuration$ = this.store
            .select(selectBehavior)
            .pipe(map((state) => state.unloadDelay));

        const unloadingSelector = createSelector(
            createSelectActivityStates(this.simulatedRegionId),
            selectBehavior,
            selectVehicles,
            (activities, behavior, vehicles) =>
                StrictObject.values(behavior.vehicleActivityMap)
                    .map(
                        (activityId) =>
                            activities[activityId] as
                                | UnloadVehicleActivityState
                                | undefined
                    )
                    .filter(
                        (activity): activity is UnloadVehicleActivityState =>
                            activity !== undefined
                    )
                    .map((activity) => ({
                        vehicle: vehicles[activity.vehicleId]!,
                        endTime: activity.startTime + activity.duration,
                    }))
        );

        this.vehiclesStatus$ = this.store.select(
            createSelector(
                selectCurrentTime,
                unloadingSelector,
                (now, unloads) =>
                    unloads.map(
                        (unload): VehicleUnloadStatus => ({
                            timeLeft: unload.endTime - now,
                            vehicleName: unload.vehicle.name,
                            vehicleId: unload.vehicle.id,
                        })
                    )
            )
        );
    }

    updateUnloadTime(duration: number) {
        this.exerciseService.proposeAction({
            type: '[UnloadArrivingVehiclesBehavior] Update UnloadDelay',
            simulatedRegionId: this.simulatedRegionId,
            behaviorId: this.behaviorId,
            unloadDelay: duration,
        });
    }
}

interface VehicleUnloadStatus {
    timeLeft: number;
    vehicleName: string;
    vehicleId: UUID;
}
