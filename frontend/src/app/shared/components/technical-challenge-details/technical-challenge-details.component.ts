import { computed, Signal, Component, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    Personnel,
    TechnicalChallenge,
    Task,
    TechnicalChallengeState,
    Guard,
    UserGeneratedContent,
    TechnicalChallengeStateMachine,
} from 'fuesim-digital-shared';
import { currentStateOf } from 'fuesim-digital-shared';
import {
    NgbNav,
    NgbNavContent,
    NgbNavItem,
    NgbNavLink,
    NgbNavLinkBase,
    NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';
import type { AppState } from '../../../state/app.state';
import {
    createSelectPersonnel,
    createSelectTask,
    selectCurrentTime,
    selectExerciseStatus,
} from '../../../state/application/selectors/exercise.selectors';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { ExerciseService } from '../../../core/exercise.service.js';
import { UserGeneratedContentEditorComponent } from '../user-generated-content-editor/user-generated-content-editor.component.js';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component.js';
import { StateMachineEditorComponent } from '../state-machine-editor/state-machine-editor.component.js';

@Component({
    selector: 'app-technical-challenge-details',
    templateUrl: './technical-challenge-details.component.html',
    styleUrls: ['./technical-challenge-details.component.scss'],
    imports: [
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbNavLinkBase,
        NgbNavContent,
        NgbNavOutlet,
        UserGeneratedContentEditorComponent,
        ProgressBarComponent,
        StateMachineEditorComponent,
    ],
})
export class TechnicalChallengeDetailsComponent {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly exerciseService = inject(ExerciseService);

    readonly technicalChallenge = input.required<TechnicalChallenge>();

    public readonly challengeAge = computed(() => {
        const technicalChallengeStartTime =
            this.technicalChallenge().simulationStartTime;
        return (
            this.store.selectSignal(selectCurrentTime)() -
            technicalChallengeStartTime
        );
    });

    readonly currentRole = this.store.selectSignal(selectCurrentMainRole);
    readonly exerciseStatus = this.store.selectSignal(selectExerciseStatus);

    public readonly exerciseRunning = computed(
        () => this.exerciseStatus() === 'running'
    );

    calculateProgress(current: number, max: number) {
        return {
            current: current / 1000,
            max: max / 1000,
            percentage: (current / max) * 100,
            finished: current >= max,
        };
    }

    public readonly tasksProgress = computed(() =>
        Object.values(this.technicalChallenge().relevantTasks).map((task) => ({
            ...task,
            ...this.calculateProgress(
                this.technicalChallenge().taskProgress[task.id] ?? 0,
                this.progressGuardsByTaskId().get(task.id)?.minProgress ?? 0
            ),
        }))
    );

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
    public readonly visibleGuards = computed<Guard[]>(() =>
        this.technicalChallenge()
            .transitions.filter((t) => t.from === this.currentState().id)
            .map(({ guard }) => guard)
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
    public readonly visibleTimerGuards = computed(() =>
        this.visibleGuards()
            .filter((guard) => guard.type === 'timerGuard')
            .map((guard) => ({
                ...guard,
                ...this.calculateProgress(
                    this.challengeAge(),
                    guard.minTimePassed
                ),
            }))
    );

    public readonly currentState: Signal<TechnicalChallengeState> = computed(
        () => currentStateOf(this.technicalChallenge())
    );

    updateContent(content: UserGeneratedContent) {
        this.exerciseService.proposeAction({
            type: '[TechnicalChallenge] Update state content',
            technicalChallengeId: this.technicalChallenge().id,
            stateId: this.currentState().id,
            userGeneratedContent: content,
        });
    }

    updateStateMachine(newStateMachine: TechnicalChallengeStateMachine) {
        console.log(newStateMachine);
    }
}
