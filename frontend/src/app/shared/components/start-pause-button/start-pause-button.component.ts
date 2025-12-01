import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationModalService } from 'src/app/core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from 'src/app/core/exercise.service';
import type { AppState } from 'src/app/state/app.state';
import { selectExerciseStatus } from 'src/app/state/application/selectors/exercise.selectors';
import { selectOwnClient } from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';

@Component({
    selector: 'app-start-pause-button',
    templateUrl: './start-pause-button.component.html',
    styleUrls: ['./start-pause-button.component.scss'],
    standalone: false,
})
export class StartPauseButtonComponent {
    public exerciseStatus$ = this.store.select(selectExerciseStatus);

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly confirmationModalService: ConfirmationModalService
    ) {}

    public async pauseExercise() {
        const response = await this.exerciseService.proposeAction({
            type: '[Exercise] Pause',
        });
        if (response.success) {
            this.sendLogAction(
                `Übung wurde pausiert. (${this.getCurrentDate()})`
            );
        }
    }

    public async startExercise() {
        if (
            selectStateSnapshot(selectExerciseStatus, this.store) ===
            'notStarted'
        ) {
            const confirmStart = await this.confirmationModalService.confirm({
                title: 'Übung starten',
                description: 'Möchten Sie die Übung wirklich starten?',
            });
            if (!confirmStart) {
                return;
            }
        }
        const response = await this.exerciseService.proposeAction({
            type: '[Exercise] Start',
        });
        if (response.success) {
            this.sendLogAction(
                `Übung wurde gestartet. (${this.getCurrentDate()})`
            );
        }
    }

    private sendLogAction(message: string) {
        this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Add Log Entry',
            name: selectStateSnapshot(selectOwnClient, this.store)!.name,
            message,
        });
    }

    private getCurrentDate(): string {
        return new Date().toLocaleDateString('de-De', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
}
