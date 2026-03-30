import { computed, OnInit, Signal, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    Personnel,
    TechnicalChallenge,
    Task,
    TechnicalChallengeState,
    UUID,
    Guard,
} from 'fuesim-digital-shared';
import { currentStateOf } from 'fuesim-digital-shared';
import {
    createSelectPersonnel,
    createSelectTask,
    createSelectTechnicalChallenge,
    selectCurrentTime,
} from '../../../../../../../state/application/selectors/exercise.selectors';
import type { AppState } from '../../../../../../../state/app.state';
import { PopupService } from '../../utility/popup.service';
import { ValuesPipe } from '../../../../../../../shared/pipes/values.pipe';

@Component({
    selector: 'app-technical-challenge-popup',
    templateUrl: './technical-challenge-popup.component.html',
    styleUrls: ['./technical-challenge-popup.component.scss'],
    imports: [ValuesPipe],
})
export class TechnicalChallengePopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    // Set via popup context before OnInit
    public technicalChallengeId!: UUID;

    // eslint-disable-next-line
    public technicalChallenge!: Signal<TechnicalChallenge>;
    public readonly assignedPersonnel = computed<[Personnel, Task][]>(() => {
        const assignments = this.technicalChallenge().assignedPersonnel;
        return Object.entries(assignments).map(([personnelId, taskId]) => [
            this.store.selectSignal(createSelectPersonnel(personnelId))(),
            this.store.selectSignal(createSelectTask(taskId))(),
        ]);
    });

    public readonly guards = computed<Guard[]>(() =>
        this.technicalChallenge().transitions.map(({ guard }) => guard)
    );
    public readonly progressGuards = computed(() =>
        this.guards().filter((guard) => guard.type === 'progressGuard')
    );
    public readonly progressGuardsByTaskId = computed(
        () =>
            new Map(this.progressGuards().map((guard) => [guard.taskId, guard]))
    );
    public readonly timerGuards = computed(() =>
        this.guards().filter((guard) => guard.type === 'timerGuard')
    );

    public exerciseTime = this.store.selectSignal(selectCurrentTime);

    public readonly currentState: Signal<TechnicalChallengeState> = computed(
        () => currentStateOf(this.technicalChallenge())
    );

    ngOnInit(): void {
        this.technicalChallenge = this.store.selectSignal(
            createSelectTechnicalChallenge(this.technicalChallengeId)
        );
    }

    public closePopup() {
        this.popupService.dismissPopup();
    }
}
