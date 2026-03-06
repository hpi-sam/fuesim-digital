import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { ConfirmationModalService } from '../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../core/exercise.service';
import type { AppState } from '../../../state/app.state';
import {
    selectExerciseStatus,
    selectExerciseType,
} from '../../../state/application/selectors/exercise.selectors';
import { selectOwnClient } from '../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../state/get-state-snapshot';
import { ParallelExerciseService } from '../../../core/parallel-exercise.service';

@Component({
    selector: 'app-start-pause-button',
    templateUrl: './start-pause-button.component.html',
    styleUrls: ['./start-pause-button.component.scss'],
    imports: [AsyncPipe],
})
export class StartPauseButtonComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly parallelExerciseService = inject(ParallelExerciseService);

    public exerciseStatus$ = this.store.select(selectExerciseStatus);

    public async pauseExercise() {
        if (
            selectStateSnapshot(selectExerciseType, this.store) !== 'parallel'
        ) {
            const response = await this.exerciseService.proposeAction({
                type: '[Exercise] Pause',
            });
            if (response.success) {
                this.sendLogAction(
                    `Übung wurde pausiert. (${this.getCurrentDate()})`
                );
            }
        } else {
            await this.parallelExerciseService.pauseParallelExercise();
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
        if (
            selectStateSnapshot(selectExerciseType, this.store) !== 'parallel'
        ) {
            const response = await this.exerciseService.proposeAction({
                type: '[Exercise] Start',
            });
            if (response.success) {
                this.sendLogAction(
                    `Übung wurde gestartet. (${this.getCurrentDate()})`
                );
            }
        } else {
            await this.parallelExerciseService.startParallelExercise();
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
