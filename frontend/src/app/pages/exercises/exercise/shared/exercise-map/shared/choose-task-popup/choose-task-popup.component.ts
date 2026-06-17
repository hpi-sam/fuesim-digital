import { Component, inject, OnInit, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { TaskType, TechnicalChallengeId, UUID } from 'fuesim-digital-shared';
import type { StateMachine } from 'fuesim-digital-shared';
import { PopupService } from '../../utility/popup.service';
import { AppState } from '../../../../../../../state/app.state';
import { createSelectAvailableTasks } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-choose-task-popup',
    imports: [],
    templateUrl: './choose-task-popup.component.html',
    styleUrl: '../chooser-popup.scss',
})
export class ChooseTaskPopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    // All are set via popup context before OnInit
    public technicalChallengeId!: TechnicalChallengeId;
    public personnelId!: UUID;
    public assignTaskCallback!: (
        stateMachineId: StateMachine['id'],
        taskTypeId: TaskType['id']
    ) => void;

    public readonly availableTasks!: Signal<
        { stateMachine: StateMachine; tasks: TaskType[] }[]
    >;

    public assignTask(
        stateMachineId: StateMachine['id'],
        taskTypeId: TaskType['id']
    ) {
        this.assignTaskCallback(stateMachineId, taskTypeId);
        this.popupService.submitPopup();
    }

    ngOnInit(): void {
        // @ts-expect-error deferred initialization, depends on technicalChallengeId
        this.availableTasks = this.store.selectSignal(
            createSelectAvailableTasks(this.technicalChallengeId)
        );
    }
}
