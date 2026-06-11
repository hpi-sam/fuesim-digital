import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
    NgbModal,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import type { TrainerKey } from 'fuesim-digital-shared';
import { exerciseTypeGermanNameDictionary } from 'fuesim-digital-shared';
import { openAlarmGroupOverviewModal } from '../alarm-group-overview/open-alarm-group-overview-modal';
import { openClientsModal } from '../clients-modal/open-clients-modal';
import { openEmergencyOperationsCenterModal } from '../emergency-operations-center/open-emergency-operations-center-modal';
import { openExerciseSettingsModal } from '../exercise-settings/open-exercise-settings-modal';
import { openExerciseStatisticsModal } from '../exercise-statistics/open-exercise-statistics-modal';
import { openHospitalEditorModal } from '../hospital-editor/hospital-editor-modal';
import { openTrainerOperationsTabletModal } from '../operations-tablet-view/trainer-operations-tablet-modal/open-trainer-operations-tablet-modal';
import { openSimulationTrainerModal } from '../simulation/trainer-modal/open-simulation-trainer-modal';
import { openSimulationSignallerModal } from '../simulation/signaller-modal/open-simulation-signaller-modal';
import { openTransferOverviewModal } from '../transfer-overview/open-transfer-overview-modal';
import { ApiService } from '../../../../../core/api.service';
import { ApplicationService } from '../../../../../core/application.service';
import { ConfirmationModalService } from '../../../../../core/confirmation-modal/confirmation-modal.service';
import { ExerciseService } from '../../../../../core/exercise.service';
import { MessageService } from '../../../../../core/messages/message.service';
import type { AppState } from '../../../../../state/app.state';
import { selectExerciseKey } from '../../../../../state/application/selectors/application.selectors';
import { selectExerciseType } from '../../../../../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../../../../../state/get-state-snapshot';
import { StartPauseButtonComponent } from '../../../../../shared/components/start-pause-button/start-pause-button.component';

@Component({
    selector: 'app-trainer-toolbar',
    templateUrl: './trainer-toolbar.component.html',
    styleUrls: ['./trainer-toolbar.component.scss'],
    imports: [
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        StartPauseButtonComponent,
    ],
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

    public readonly isExerciseTemplate = computed<boolean>(
        () => this.store.selectSignal(selectExerciseType)() === 'template'
    );
    public readonly exerciseTemplateId = computed(
        () =>
            this.exerciseService.additionalExerciseMeta()?.exerciseTemplate?.id
    );

    public readonly exerciseTypeName = computed(
        () =>
            exerciseTypeGermanNameDictionary[
                this.store.selectSignal(selectExerciseType)()
            ]
    );

    public openClientsModal() {
        openClientsModal(this.modalService);
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

    public openOperationsTabletModal() {
        openTrainerOperationsTabletModal(this.modalService);
    }

    public async deleteExercise() {
        const exerciseKey = selectStateSnapshot(selectExerciseKey, this.store)!;
        const deletionConfirmed = await this.confirmationModalService.confirm({
            title: `${this.exerciseTypeName()} löschen`,
            description: `Möchten Sie die ${this.exerciseTypeName()} wirklich unwiederbringlich löschen?`,
            confirmationString: exerciseKey,
        });
        if (!deletionConfirmed) {
            return;
        }
        // If we get disconnected by the server during the deletion a disconnect error would be displayed
        await this.applicationService.leaveExercise();

        const templateId = this.exerciseTemplateId();
        await (
            templateId
                ? this.apiService.deleteExerciseTemplate(templateId)
                : this.apiService.deleteExercise(exerciseKey as TrainerKey)
        )
            .then((response) => {
                this.messageService.postMessage({
                    title: `${this.exerciseTypeName()} erfolgreich gelöscht`,
                    color: 'success',
                });
            })
            .finally(() => {
                this.router.navigate(['/']);
            });
    }
}
