import { Component, computed, inject, input, Signal } from '@angular/core';
import type {
    StateMachine,
    Personnel,
    TaskType,
    StateMachineState,
    Transition,
} from 'fuesim-digital-shared';
import { Store } from '@ngrx/store';
import {
    currentStateOf,
    getGuardProgress,
    getTaskProgress,
} from 'fuesim-digital-shared';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component.js';
import {
    createSelectPersonnel,
    createSelectTaskType,
    selectCurrentTime,
    selectExerciseStatus,
    selectTaskTypes,
} from '../../../state/application/selectors/exercise.selectors.js';
import type { AppState } from '../../../state/app.state.js';
import { selectStateSnapshot } from '../../../state/get-state-snapshot.js';

@Component({
    selector: 'app-state-machine-details',
    imports: [ProgressBarComponent],
    templateUrl: './state-machine-details.component.html',
    styleUrl: './state-machine-details.component.scss',
})
export class StateMachineDetailsComponent {
    private readonly store = inject<Store<AppState>>(Store);
    readonly stateMachine = input.required<StateMachine>();

    readonly currentState: Signal<StateMachineState> = computed(() =>
        currentStateOf(this.stateMachine())
    );
    readonly currentTime = this.store.selectSignal(selectCurrentTime);
    readonly exerciseStatus = this.store.selectSignal(selectExerciseStatus);

    readonly exerciseRunning = computed(
        () => this.exerciseStatus() === 'running'
    );

    public readonly challengeAge = computed(() => {
        const technicalChallengeStartTime =
            this.stateMachine().simulationStartTime;
        return (
            this.store.selectSignal(selectCurrentTime)() -
            technicalChallengeStartTime
        );
    });

    public readonly assignedPersonnel = computed<[Personnel, TaskType][]>(
        () => {
            const assignments = this.stateMachine().assignedPersonnel;
            return Object.entries(assignments).map(([personnelId, taskId]) => [
                this.store.selectSignal(createSelectPersonnel(personnelId))(),
                this.store.selectSignal(createSelectTaskType(taskId))(),
            ]);
        }
    );

    public readonly transitions: Signal<
        {
            id: string;
            targetStateName: string;
            requiredProgress: number;
            currentProgress: number;
            guardName: string;
        }[]
    > = computed(() =>
        this.currentState().outgoingTransitions.map((transition) => {
            // TODO@Felix: refactor into helper function(s)

            const currentProgress = getGuardProgress(
                transition.guard,
                this.stateMachine(),
                this.currentTime()
            );

            const guardName = this.getGuardName(
                transition.guard,
                this.stateMachine()
            );

            return {
                id: transition.targetState,
                targetStateName:
                    this.stateMachine().states[transition.targetState]!.title,
                requiredProgress:
                    (transition.guard.type === 'taskGuard' ||
                    transition.guard.type === 'timerGuard'
                        ? transition.guard.minProgress
                        : 1) * 100,
                currentProgress: currentProgress.progressPercentage * 100,
                guardName,
            };
        })
    );
    public readonly taskTypes = this.store.selectSignal(selectTaskTypes);
    public readonly tasks = computed(() =>
        Object.values(this.stateMachine().tasks).map((task) => ({
            id: task.taskTypeId,
            totalDuration: task.totalDuration / 1000,
            name: this.taskTypes()[task.taskTypeId]!.taskName,
            current:
                getTaskProgress(task.taskTypeId, this.stateMachine())
                    .timeSpent / 1000,
        }))
    );

    public readonly timers = computed(() =>
        Object.values(this.stateMachine().timers).map((timer) => ({
            ...timer,
            totalDuration: timer.totalDuration / 1000,
        }))
    );

    private getGuardName(
        guard: Transition['guard'],
        stateMachine: StateMachine
    ): string {
        switch (guard.type) {
            case 'taskGuard':
                return selectStateSnapshot(
                    createSelectTaskType(guard.taskId),
                    this.store
                ).taskName;
            case 'timerGuard':
                return stateMachine.timers[guard.timerId]!.name;
            case 'andGuard': {
                const names = guard.guards.map((g) =>
                    this.getGuardName(g, stateMachine)
                );
                if (names.length <= 1) return names[0] ?? '';
                return `${names.slice(0, -1).join(', ')} und ${names.at(-1)}`;
            }
            case 'notGuard':
                return `nicht ${this.getGuardName(guard.guard, stateMachine)}`;
        }
    }
}
