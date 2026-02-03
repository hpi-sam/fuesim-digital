import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/state/app.state';
import {
    selectCurrentTime,
    selectParticipantId,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-operation-details-tab',
    standalone: false,
    templateUrl: './operation-details.component.html',
    styleUrl: './operation-details.component.scss',
})
export class OperationDetailsTabComponent {
    @Input()
    public showExerciseDetails = false;

    public constructor(private readonly store: Store<AppState>) {}

    public readonly participantId$ = this.store.select(selectParticipantId);
    public readonly currentTime$ = this.store.select(selectCurrentTime);
}
