import type { OnInit } from '@angular/core';
import { Component, inject, input } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import type {
    UnloadArrivingVehiclesBehaviorState,
    UnloadVehicleActivityState,
    UUID,
} from 'fuesim-digital-shared';
import { StrictObject } from 'fuesim-digital-shared';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { ExerciseService } from '../../../../../../../../../../core/exercise.service';
import type { AppState } from '../../../../../../../../../../state/app.state';
import {
    createSelectBehaviorState,
    createSelectActivityStates,
    selectVehicles,
    selectCurrentTime,
} from '../../../../../../../../../../state/application/selectors/exercise.selectors';
import { AppSaveOnTypingDirective } from '../../../../../../../../../../shared/directives/app-save-on-typing.directive';
import { DisplayValidationComponent } from '../../../../../../../../../../shared/validation/display-validation/display-validation.component';
import { FormatDurationPipe } from '../../../../../../../../../../shared/pipes/format-duration.pipe';

@Component({
    selector: 'app-simulated-region-overview-behavior-unload-arriving-vehicles',
    templateUrl:
        './simulated-region-overview-behavior-unload-arriving-vehicles.component.html',
    styleUrls: [
        './simulated-region-overview-behavior-unload-arriving-vehicles.component.scss',
    ],
    imports: [
        FormsModule,
        AppSaveOnTypingDirective,
        DisplayValidationComponent,
        FormatDurationPipe,
        AsyncPipe,
    ],
})
export class SimulatedRegionOverviewBehaviorUnloadArrivingVehiclesComponent
    implements OnInit
{
    private readonly exerciseService = inject(ExerciseService);
    readonly store = inject<Store<AppState>>(Store);

    readonly simulatedRegionId = input.required<UUID>();

    readonly behaviorId = input.required<UUID>();

    unloadDuration$?: Observable<number>;
    vehiclesStatus$?: Observable<VehicleUnloadStatus[]>;

    ngOnInit(): void {
        const selectBehavior =
            createSelectBehaviorState<UnloadArrivingVehiclesBehaviorState>(
                this.simulatedRegionId(),
                this.behaviorId()
            );
        this.unloadDuration$ = this.store
            .select(selectBehavior)
            .pipe(map((state) => state.unloadDelay));

        const unloadingSelector = createSelector(
            createSelectActivityStates(this.simulatedRegionId()),
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
            simulatedRegionId: this.simulatedRegionId(),
            behaviorId: this.behaviorId(),
            unloadDelay: duration,
        });
    }
}

interface VehicleUnloadStatus {
    timeLeft: number;
    vehicleName: string;
    vehicleId: UUID;
}
