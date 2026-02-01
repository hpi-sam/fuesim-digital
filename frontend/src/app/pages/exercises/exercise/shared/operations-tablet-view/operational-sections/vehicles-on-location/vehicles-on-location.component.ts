import { Component } from '@angular/core';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { createSelector, Store } from '@ngrx/store';
import { AppState } from '../../../../../../../state/app.state';
import { selectVehicles } from '../../../../../../../state/application/selectors/exercise.selectors';
import { map } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

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
        createSelector(selectVehicles, (vehicles) => {
            return Object.values(vehicles).filter(
                (vehicle) => vehicle.operationalAssignment === null
            );
        })
    );

    public onVehicleDropped(event: CdkDragDrop<string[]>) {
        console.log(event);
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
