import { Component } from '@angular/core';
import { createSelector, Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import { selectVehicles } from 'src/app/state/application/selectors/exercise.selectors';
import { ExerciseService } from 'src/app/core/exercise.service';

@Component({
    selector: 'app-local-section-leader',
    standalone: false,
    templateUrl: './local-section-leader.component.html',
    styleUrl: './local-section-leader.component.scss',
})
export class LocalSectionLeaderComponent {
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
}
