import { Component } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ExerciseService } from 'src/app/core/exercise.service';
import { AppState } from 'src/app/state/app.state';
import { selectVisibleVehicles } from 'src/app/state/application/selectors/shared.selectors';

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

    public readonly vehicles$ = this.store.select(
        createSelector(selectVisibleVehicles, (vehicles) =>
            Object.values(vehicles).filter(
                (vehicle) => vehicle.operationalAssignment === null
            )
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
