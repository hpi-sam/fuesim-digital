import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { assertExhaustiveness } from 'digital-fuesim-manv-shared';
import type { AppState } from '../state/app.state';
import {
    selectExerciseId,
    selectExerciseStateMode,
    selectLastClientName,
} from '../state/application/selectors/application.selectors';
import { selectStateSnapshot } from '../state/get-state-snapshot';
import { ExerciseService } from './exercise.service';
import { TimeTravelService } from './time-travel.service';

/**
 * This service encapsulates the logic for switching between the live exercise, timeTravel and an empty state (e.g. on the landing page).
 * Its API to switch between exercise state modes should be used instead of those in the {@link ExerciseService} and {@link TimeTravelService}.
 */
@Injectable({
    providedIn: 'root',
})
export class ApplicationService {
    constructor(
        private readonly timeTravelService: TimeTravelService,
        private readonly exerciseService: ExerciseService,
        private readonly store: Store<AppState>
    ) {}

    /**
     * A new mode must be set immediately after this function is called
     */
    private stopCurrentMode() {
        const currentExerciseStateMode = selectStateSnapshot(
            selectExerciseStateMode,
            this.store
        );
        switch (currentExerciseStateMode) {
            case 'exercise':
                this.exerciseService.leaveExercise();
                break;
            case 'timeTravel':
                this.timeTravelService.stopTimeTravel();
                break;
            case undefined:
                break;
            default:
                assertExhaustiveness(currentExerciseStateMode);
        }
    }

    public async joinExercise(
        ...args: Parameters<typeof this.exerciseService.joinExercise>
    ) {
        this.stopCurrentMode();
        // TODO: this is currently an invalid state because joinExercise is async
        // joinExercise could synchronously set the ApplicationState to something valid e.g. an intermediate 'loading' state
        // This should only be relevant if joinExercise takes a long time
        return this.exerciseService.joinExercise(...args);
    }

    /**
     * Assuming that the client was already connected to an exercise:
     * Rejoin this exercise with the same credentials as the last time
     */
    public async rejoinExercise() {
        return this.joinExercise(
            selectStateSnapshot(selectExerciseId, this.store)!,
            selectStateSnapshot(selectLastClientName, this.store)!
        );
    }

    public async startTimeTravel(
        ...args: Parameters<typeof this.timeTravelService.startTimeTravel>
    ) {
        this.stopCurrentMode();
        return this.timeTravelService.startTimeTravel(...args);
    }

    public async leaveExercise() {
        this.stopCurrentMode();
    }
}
