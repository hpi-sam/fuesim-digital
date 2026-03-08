import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import { selectExerciseStatus } from '../../../state/application/selectors/exercise.selectors';
import { selectOwnClient } from '../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';

@Component({
    selector: 'app-start-pause-button',
    templateUrl: './start-pause-button.component.html',
    styleUrls: ['./start-pause-button.component.scss'],
    standalone: false,
})
export class StartPauseButtonComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );

    public exerciseStatus$ = this.store.select(selectExerciseStatus);

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
            isPrivate: true,
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
