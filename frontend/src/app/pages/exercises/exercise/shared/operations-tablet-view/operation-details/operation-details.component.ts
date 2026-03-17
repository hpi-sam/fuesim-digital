import { Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { AppState } from '../../../../../../state/app.state';
import {
    selectCurrentTime,
    selectParticipantKey,
} from '../../../../../../state/application/selectors/exercise.selectors';
import { ExerciseStateBadgeComponent } from '../../exercise-state-badge/exercise-state-badge.component';
import { OperationsMapComponent } from './operations-map/operations-map.component';
import { OperationsVehiclesComponent } from './operations-vehicles/operations-vehicles.component';

@Component({
    selector: 'app-operation-details-tab',
    templateUrl: './operation-details.component.html',
    styleUrl: './operation-details.component.scss',
    imports: [
        AsyncPipe,
        ExerciseStateBadgeComponent,
        OperationsMapComponent,
        OperationsVehiclesComponent,
    ],
})
export class OperationDetailsTabComponent {
    public readonly showExerciseDetails = input(false);
    private readonly store = inject(Store<AppState>);

    public readonly participantId$ = this.store.select(selectParticipantKey);
    public readonly currentTime$ = this.store.select(selectCurrentTime);
}
