import type { OnDestroy, OnInit } from '@angular/core';
import { Component, computed, inject } from '@angular/core';
import {
    NgbModal,
    NgbTooltip,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownButtonItem,
    NgbDropdownItem,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    StateExport,
    cloneDeepMutable,
    StateHistoryCompound,
    exportPatientsToCSV,
} from 'fuesim-digital-shared';
import { Subject } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import Package from '../../../../../../package.json';
import { openPartialExportModal } from '../shared/partial-export/open-partial-export-selection-modal';
import { ExerciseService } from '../../../../core/exercise.service';
import type { AppState } from '../../../../state/app.state';
import { ApiService } from '../../../../core/api.service';
import { ApplicationService } from '../../../../core/application.service';
import { MessageService } from '../../../../core/messages/message.service';
import { saveBlob } from '../../../../shared/functions/save-blob';
import {
    selectExerciseStateMode,
    selectTimeConstraints,
    selectExerciseKey,
} from '../../../../state/application/selectors/application.selectors';
import {
    selectParticipantKey,
    selectExerciseState,
    selectSelectedCollections,
} from '../../../../state/application/selectors/exercise.selectors';
import { selectOwnClient } from '../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../state/get-state-snapshot';
import { TimeTravelComponent } from '../shared/time-travel/time-travel.component';
import { ExerciseMapComponent } from '../shared/exercise-map/exercise-map.component';
import { EmergencyOperationsCenterFullComponent } from '../shared/emergency-operations-center/emergency-operations-center-full/emergency-operations-center-full.component';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { OperationsTabletViewComponent } from '../shared/operations-tablet-view/operations-tablet-view.component';
import { ExerciseStateBadgeComponent } from '../../../../shared/components/exercise-state-badge/exercise-state-badge.component';
import { ParallelExerciseStatusBarComponent } from '../../../../shared/components/parallel-exercise-status-bar/parallel-exercise-status-bar.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import {
    openInviteModal,
    openParticipantsModal,
    openTrainersModal,
} from '../shared/clients-modal/open-clients-modal';
import { TrainerMapEditorComponent } from '../shared/trainer-map-editor/trainer-map-editor.component';
import { openSelectCollectionModal } from '../../../marketplace/shared/modals/marketplace-select-collection-modal/select-collection-modal';
import { LoadingModalService } from '../../../../core/loading-modal/loading-modal.service';

@Component({
    selector: 'app-exercise',
    templateUrl: './exercise.component.html',
    styleUrls: ['./exercise.component.scss'],
    imports: [
        RouterLink,
        ExerciseStateBadgeComponent,
        NgbTooltip,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        TimeTravelComponent,
        ExerciseMapComponent,
        TrainerMapEditorComponent,
        EmergencyOperationsCenterFullComponent,
        AsyncPipe,
        FormatDurationPipe,
        OperationsTabletViewComponent,
        ParallelExerciseStatusBarComponent,
        CopyButtonComponent,
    ],
})
export class ExerciseComponent implements OnDestroy, OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly apiService = inject(ApiService);
    private readonly applicationService = inject(ApplicationService);
    readonly exerciseService = inject(ExerciseService);
    private readonly messageService = inject(MessageService);
    private readonly modalService = inject(NgbModal);
    private readonly loadingModalService = inject(LoadingModalService);

    private readonly destroy = new Subject<void>();

    public readonly exerciseStateMode$ = this.store.select(
        selectExerciseStateMode
    );
    public readonly participantKey =
        this.store.selectSignal(selectParticipantKey);
    public readonly exerciseKey = this.store.selectSignal(selectExerciseKey);
    public readonly timeConstraints$ = this.store.select(selectTimeConstraints);
    public readonly ownClient = this.store.selectSignal(selectOwnClient);

    public readonly isTrainer = computed(
        () => this.ownClient()?.role.mainRole === 'trainer'
    );
    public readonly participantUrl = computed(
        () => `${location.origin}/exercises/${this.participantKey()}`
    );
    public readonly trainerUrl = computed(
        () => `${location.origin}/exercises/${this.exerciseKey()}`
    );

    public ngOnInit() {
        const selectedCollections = selectStateSnapshot(
            selectSelectedCollections,
            this.store
        );
        if (selectedCollections.length === 0) {
            openSelectCollectionModal(this.modalService, {
                showDependencyElements: true,
                allowLeave: false,
                allowCreate: true,
                showInfoBanner: true,
            }).then(async (result) => {
                if (result === null) return;
                this.loadingModalService.showLoading({
                    title: 'Sammlung wird hinzugefügt',
                    description: 'Ihre Übungselemente werden vorbereitet',
                });
                await this.exerciseService.addCollection(result);
                this.loadingModalService.closeLoading();
            });
        }
    }

    readonly version: string = Package.version;

    public openInviteModal() {
        openInviteModal(this.modalService);
    }

    public openAddParticipantModal() {
        openParticipantsModal(this.modalService);
    }

    public openAddTrainerModal() {
        openTrainersModal(this.modalService);
    }

    public leaveTimeTravel() {
        this.applicationService.rejoinExercise();
        this.messageService.postMessage({
            title: 'Zurück in die Zukunft!',
            color: 'info',
        });
    }

    public async exportExerciseWithHistory() {
        const history = await this.apiService.exerciseHistory();
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const blob = new Blob([
            JSON.stringify(
                new StateExport(
                    cloneDeepMutable(currentState),
                    new StateHistoryCompound(
                        history.actionsWrappers.map(
                            (actionWrapper) => actionWrapper.action
                        ),
                        cloneDeepMutable(history.initialState)
                    )
                )
            ),
        ]);
        saveBlob(blob, `exercise-state-${currentState.participantKey}.json`);
    }

    public partialExport() {
        openPartialExportModal(this.modalService);
    }

    public patientsCsvExport() {
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const csvContent = exportPatientsToCSV(currentState);
        const blob = new Blob([csvContent]);
        saveBlob(blob, `patienten-${currentState.participantKey}.csv`);
    }

    public exportExerciseState() {
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const blob = new Blob([
            JSON.stringify(new StateExport(cloneDeepMutable(currentState))),
        ]);
        saveBlob(blob, `exercise-state-${currentState.participantKey}.json`);
    }

    ngOnDestroy(): void {
        this.destroy.next();
    }
}
