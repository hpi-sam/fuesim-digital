import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ApiService } from 'src/app/core/api.service.js';
import { ApplicationService } from 'src/app/core/application.service.js';
import { ConfirmationModalService } from 'src/app/core/confirmation-modal/confirmation-modal.service.js';
import { ExerciseService } from 'src/app/core/exercise.service.js';
import { MessageService } from 'src/app/core/messages/message.service.js';
import type { AppState } from 'src/app/state/app.state.js';
import { selectExerciseId } from 'src/app/state/application/selectors/application.selectors.js';
import { selectExerciseStatus } from 'src/app/state/application/selectors/exercise.selectors.js';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot.js';
import { openAlarmGroupOverviewModal } from '../alarm-group-overview/open-alarm-group-overview-modal.js';
import { openClientOverviewModal } from '../client-overview/open-client-overview-modal.js';
import { openEmergencyOperationsCenterModal } from '../emergency-operations-center/open-emergency-operations-center-modal.js';
import { openExerciseSettingsModal } from '../exercise-settings/open-exercise-settings-modal.js';
import { openExerciseStatisticsModal } from '../exercise-statistics/open-exercise-statistics-modal.js';
import { openHospitalEditorModal } from '../hospital-editor/hospital-editor-modal.js';
import { openSimulationTrainerModal } from '../simulation/trainer-modal/open-simulation-trainer-modal.js';
import { openTransferOverviewModal } from '../transfer-overview/open-transfer-overview-modal.js';
import { openSimulationSignallerModal } from '../simulation/signaller-modal/open-simulation-signaller-modal.js';

@Component({
    selector: 'app-trainer-toolbar',
    templateUrl: './trainer-toolbar.component.html',
    styleUrls: ['./trainer-toolbar.component.scss'],
    standalone: false,
})
export class TrainerToolbarComponent {
    public exerciseStatus$ = this.store.select(selectExerciseStatus);

    constructor(
        private readonly store: Store<AppState>,
        private readonly exerciseService: ExerciseService,
        private readonly apiService: ApiService,
        public readonly applicationService: ApplicationService,
        private readonly modalService: NgbModal,
        private readonly router: Router,
        private readonly confirmationModalService: ConfirmationModalService,
        private readonly messageService: MessageService
    ) {}

    public openClientOverview() {
        openClientOverviewModal(this.modalService);
    }

    public openTransferOverview() {
        openTransferOverviewModal(this.modalService);
    }

    public openAlarmGroupOverview() {
        openAlarmGroupOverviewModal(this.modalService);
    }

    public openHospitalEditor() {
        openHospitalEditorModal(this.modalService);
    }

    public openEmergencyOperationsCenter() {
        openEmergencyOperationsCenterModal(this.modalService);
    }

    public openExerciseSettings() {
        openExerciseSettingsModal(this.modalService);
    }

    public openExerciseStatisticsModal() {
        openExerciseStatisticsModal(this.modalService);
    }

    public openSimulationTrainerModal() {
        openSimulationTrainerModal(this.modalService);
    }

    public openSimulationSignallerModal() {
        openSimulationSignallerModal(this.modalService);
    }

    public async deleteExercise() {
        const exerciseId = selectStateSnapshot(selectExerciseId, this.store)!;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Übung löschen',
            description:
                'Möchten Sie die Übung wirklich unwiederbringlich löschen?',
            confirmationString: exerciseId,
        });
        if (!deletionConfirmed) {
            return;
        }
        // If we get disconnected by the server during the deletion a disconnect error would be displayed
        this.applicationService.leaveExercise();
        this.apiService
            .deleteExercise(exerciseId)
            .then(
                (response) => {
                    this.messageService.postMessage({
                        title: 'Übung erfolgreich gelöscht',
                        color: 'success',
                    });
                },
                (error) => {
                    this.messageService.postError({
                        title: 'Fehler beim Löschen der Übung',
                        error,
                    });
                }
            )
            .finally(() => {
                this.router.navigate(['/']);
            });
    }
}
