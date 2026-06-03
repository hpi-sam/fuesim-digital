import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { uuid } from 'fuesim-digital-shared';
import { Router } from '@angular/router';
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
import { MessageService } from '../../../core/messages/message.service.js';
import { ApiService } from '../../../core/api.service.js';

@Component({
    selector: 'app-start-pause-button',
    templateUrl: './start-pause-button.component.html',
    styleUrls: ['./start-pause-button.component.scss'],
})
export class StartPauseButtonComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly parallelExerciseService = inject(ParallelExerciseService);
    private readonly messageService = inject(MessageService);
    private readonly apiService = inject(ApiService);
    private readonly router = inject(Router);

    public readonly exerciseStatus =
        this.store.selectSignal(selectExerciseStatus);
    public readonly exerciseType = this.store.selectSignal(selectExerciseType);

    public async pauseExercise() {
        if (this.exerciseType() !== 'parallel') {
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
        if (this.exerciseStatus() === 'notStarted') {
            const confirmStart = await this.confirmationModalService.confirm({
                title: 'Übung starten',
                description: 'Möchten Sie die Übung wirklich starten?',
            });
            if (!confirmStart) {
                return;
            }
        }
        if (this.exerciseType() !== 'parallel') {
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

    protected async tryToCreateNewExercise() {
        const template =
            this.exerciseService.additionalExerciseMeta()?.exerciseTemplate;
        if (!template) {
            this.messageService.postError({
                title: 'Ungültige Operation!',
            });
            return;
        }

        const confirmation = await this.confirmationModalService.confirm({
            title: 'Neue Übung erstellen',
            description:
                'Dies ist eine Übungsvorlage. Wollen Sie eine neue Übung aus dieser Vorlage erstellen?',
        });
        if (confirmation) {
            const { trainerKey } =
                await this.apiService.createExerciseFromTemplate(template.id);
            this.messageService.postMessage({
                title: 'Übung erfolgreich erstellt',
                body: '',
                color: 'success',
            });
            await this.router.navigate(['/exercises', trainerKey]);
        }
    }

    private sendLogAction(message: string) {
        this.exerciseService.proposeAction({
            type: '[Emergency Operation Center] Add Log Entry',
            name: selectStateSnapshot(selectOwnClient, this.store)!.name,
            message,
            isPrivate: true,
            id: uuid(),
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
