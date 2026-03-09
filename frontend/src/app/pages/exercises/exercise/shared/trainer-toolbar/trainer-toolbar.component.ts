import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { TrainerKey } from 'fuesim-digital-shared';
import { openAlarmGroupOverviewModal } from '../alarm-group-overview/open-alarm-group-overview-modal';
import { openClientOverviewModal } from '../client-overview/open-client-overview-modal';
import { openEmergencyOperationsCenterModal } from '../emergency-operations-center/open-emergency-operations-center-modal';
import { openExerciseSettingsModal } from '../exercise-settings/open-exercise-settings-modal';
import { openExerciseStatisticsModal } from '../exercise-statistics/open-exercise-statistics-modal';
import { openHospitalEditorModal } from '../hospital-editor/hospital-editor-modal';
import { openSimulationTrainerModal } from '../simulation/trainer-modal/open-simulation-trainer-modal';
import { openTransferOverviewModal } from '../transfer-overview/open-transfer-overview-modal';
import { openSimulationSignallerModal } from '../simulation/signaller-modal/open-simulation-signaller-modal';
import { ApiService } from '../../../../../core/api.service';
import { ApplicationService } from '../../../../../core/application.service';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { MessageService } from '../../../../../core/messages/message.service';
import type { AppState } from '../../../../../state/app.state';
import { selectExerciseKey } from '../../../../../state/application/selectors/application.selectors';
import { selectExerciseStatus } from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';

@Component({
    selector: 'app-trainer-toolbar',
    templateUrl: './trainer-toolbar.component.html',
    styleUrls: ['./trainer-toolbar.component.scss'],
    standalone: false,
})
export class TrainerToolbarComponent {
    private readonly store = inject<Store<AppState>>(Store);
    readonly exerciseService = inject(ExerciseService);
    private readonly apiService = inject(ApiService);
    readonly applicationService = inject(ApplicationService);
    private readonly modalService = inject(NgbModal);
    private readonly router = inject(Router);
    private readonly confirmationModalService = inject(
        ConfirmationModalService
    );
    private readonly messageService = inject(MessageService);

    public exerciseStatus$ = this.store.select(selectExerciseStatus);

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
        const exerciseKey = selectStateSnapshot(selectExerciseKey, this.store)!;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: 'Übung löschen',
            description:
                'Möchten Sie die Übung wirklich unwiederbringlich löschen?',
            confirmationString: exerciseKey,
        });
        if (!deletionConfirmed) {
            return;
        }
        // If we get disconnected by the server during the deletion a disconnect error would be displayed
        this.applicationService.leaveExercise();
        this.apiService
            .deleteExercise(exerciseKey as TrainerKey)
            .then((response) => {
                this.messageService.postMessage({
                    title: 'Übung erfolgreich gelöscht',
                    color: 'success',
                });
            })
            .finally(() => {
                this.router.navigate(['/']);
            });
    }
}
