import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
    StateExport,
    cloneDeepMutable,
    StateHistoryCompound,
} from 'digital-fuesim-manv-shared';
import { Subject } from 'rxjs';
import { ApiService } from 'src/app/core/api.service';
import { ApplicationService } from 'src/app/core/application.service';
import { MessageService } from 'src/app/core/messages/message.service';
import { saveBlob } from 'src/app/shared/functions/save-blob';
import type { AppState } from 'src/app/state/app.state';
import {
    selectExerciseStateMode,
    selectTimeConstraints,
    selectExerciseId,
} from 'src/app/state/application/selectors/application.selectors';
import {
    selectParticipantId,
    selectExerciseState,
} from 'src/app/state/application/selectors/exercise.selectors';
import { selectOwnClient } from 'src/app/state/application/selectors/shared.selectors';
import { selectStateSnapshot } from 'src/app/state/get-state-snapshot';
import Package from 'package.json';
import { openPartialExportModal } from '../shared/partial-export/open-partial-export-selection-modal';

@Component({
    selector: 'app-exercise',
    templateUrl: './exercise.component.html',
    styleUrls: ['./exercise.component.scss'],
    standalone: false,
})
export class ExerciseComponent implements OnDestroy {
    private readonly destroy = new Subject<void>();

    public readonly exerciseStateMode$ = this.store.select(
        selectExerciseStateMode
    );
    public readonly participantId$ = this.store.select(selectParticipantId);
    public readonly timeConstraints$ = this.store.select(selectTimeConstraints);
    public readonly ownClient$ = this.store.select(selectOwnClient);

    readonly version: string = Package.version;

    constructor(
        private readonly store: Store<AppState>,
        private readonly apiService: ApiService,
        private readonly applicationService: ApplicationService,
        private readonly messageService: MessageService,
        private readonly modalService: NgbModal
    ) {}

    public shareExercise(type: 'participantId' | 'trainerId') {
        const id = selectStateSnapshot(
            type === 'participantId' ? selectParticipantId : selectExerciseId,
            this.store
        );
        const url = `${location.origin}/exercises/${id}`;
        // Could be unavailable in insecure contexts
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (navigator.share) {
            navigator.share({ url }).catch((error) => {
                if (error.name === 'AbortError') {
                    return;
                }
                this.messageService.postError({
                    title: 'Fehler beim Teilen der Übung',
                    error: { error, url },
                });
            });
            return;
        }
        navigator.clipboard.writeText(url);

        this.messageService.postMessage({
            title: 'Link wurde in die Zwischenablage kopiert',
            body: 'Sie können ihn nun teilen.',
            color: 'info',
        });
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
        saveBlob(blob, `exercise-state-${currentState.participantId}.json`);
    }

    public partialExport() {
        openPartialExportModal(this.modalService);
    }

    public exportExerciseState() {
        const currentState = selectStateSnapshot(
            selectExerciseState,
            this.store
        );
        const blob = new Blob([
            JSON.stringify(new StateExport(cloneDeepMutable(currentState))),
        ]);
        saveBlob(blob, `exercise-state-${currentState.participantId}.json`);
    }

    ngOnDestroy(): void {
        this.destroy.next();
    }
}
