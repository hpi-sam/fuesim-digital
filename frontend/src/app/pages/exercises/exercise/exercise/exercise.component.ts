import { Component, computed, effect, inject } from '@angular/core';
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
    exportPatientsToCSV,
    currentStateVersion,
} from 'fuesim-digital-shared';
import { AsyncPipe, Location as NgLocation } from '@angular/common';
import {
    ActivatedRoute,
    Router,
    RouterOutlet,
    RouterLinkWithHref,
} from '@angular/router';
import Package from '../../../../../../package.json';
import { openPartialExportModal } from '../shared/partial-export/open-partial-export-selection-modal';
import { ExerciseService } from '../../../../core/exercise.service';
import type { AppState } from '../../../../state/app.state';
import { ApiService } from '../../../../core/api.service';
import { saveBlob } from '../../../../shared/functions/save-blob';
import {
    selectExerciseStateMode,
    selectTimeConstraints,
    selectExerciseKey,
} from '../../../../state/application/selectors/application.selectors';
import {
    selectParticipantKey,
    selectExerciseState,
} from '../../../../state/application/selectors/exercise.selectors';
import { selectOwnClient } from '../../../../state/application/selectors/shared.selectors';
import { selectStateSnapshot } from '../../../../state/get-state-snapshot';
import { FormatDurationPipe } from '../../../../shared/pipes/format-duration.pipe';
import { ExerciseStateBadgeComponent } from '../../../../shared/components/exercise-state-badge/exercise-state-badge.component';
import { ParallelExerciseStatusBarComponent } from '../../../../shared/components/parallel-exercise-status-bar/parallel-exercise-status-bar.component';
import { CopyButtonComponent } from '../../../../shared/components/copy-button/copy-button.component';
import {
    openInviteModal,
    openParticipantsModal,
    openTrainersModal,
} from '../shared/clients-modal/open-clients-modal';
import { environment } from '../../../../../environments/environment.js';

@Component({
    selector: 'app-exercise',
    templateUrl: './exercise.component.html',
    styleUrls: ['./exercise.component.scss'],
    imports: [
        ExerciseStateBadgeComponent,
        NgbTooltip,
        NgbDropdown,
        NgbDropdownToggle,
        NgbDropdownMenu,
        NgbDropdownButtonItem,
        NgbDropdownItem,
        AsyncPipe,
        FormatDurationPipe,
        ParallelExerciseStatusBarComponent,
        CopyButtonComponent,
        RouterOutlet,
        RouterLinkWithHref,
    ],
})
export class ExerciseComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly apiService = inject(ApiService);
    readonly exerciseService = inject(ExerciseService);
    private readonly modalService = inject(NgbModal);
    readonly location = inject(NgLocation);
    private readonly router = inject(Router);
    protected readonly route = inject(ActivatedRoute);

    public readonly exerciseStateMode = this.store.selectSignal(
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

    readonly version: string = Package.version;
    readonly docsUrl = environment.docsUrl;

    constructor() {
        effect(() => {
            if (this.exerciseStateMode() !== 'exercise') return;

            if (this.ownClient()?.isInWaitingRoom) {
                this.router.navigate(['/exercises', this.exerciseKey()]);
            } else {
                switch (this.ownClient()?.role.specificRole) {
                    case 'eoc':
                        this.router.navigate(['eoc'], {
                            relativeTo: this.route,
                            replaceUrl: true,
                        });
                        break;
                    case 'operationsTablet':
                        this.router.navigate(['operations'], {
                            relativeTo: this.route,
                            replaceUrl: true,
                        });
                        break;
                    case 'mapOperator':
                    case 'trainer':
                        this.router.navigate(['map'], {
                            relativeTo: this.route,
                            replaceUrl: true,
                        });
                        break;
                    case undefined:
                        this.router.navigate([], {
                            relativeTo: this.route,
                            replaceUrl: true,
                        });
                }
            }
        });
    }

    public openInviteModal() {
        openInviteModal(this.modalService);
    }

    public openAddParticipantModal() {
        openParticipantsModal(this.modalService);
    }

    public openAddTrainerModal() {
        openTrainersModal(this.modalService);
    }

    public async exportExerciseWithHistory() {
        const history = await this.apiService.exerciseHistory();
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const blob = new Blob([
            JSON.stringify({
                type: 'complete',
                fileVersion: 1,
                dataVersion: currentStateVersion,
                currentState,
                history: {
                    actionHistory: history.actionsWrappers.map(
                        (actionWrapper) => actionWrapper.action
                    ),
                    initialState: history.initialState,
                },
            } satisfies StateExport),
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
            JSON.stringify({
                type: 'complete',
                fileVersion: 1,
                dataVersion: currentStateVersion,
                currentState,
                history: undefined,
            } satisfies StateExport),
        ]);
        saveBlob(blob, `exercise-state-${currentState.participantKey}.json`);
    }
}
