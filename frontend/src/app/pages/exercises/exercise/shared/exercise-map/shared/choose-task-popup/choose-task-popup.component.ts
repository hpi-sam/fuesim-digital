import {
    Component,
    inject,
    OnInit,
    Signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Task, TechnicalChallengeId, UUID } from 'fuesim-digital-shared';
import type { StateMachine } from 'fuesim-digital-shared';
import { PopupService } from '../../utility/popup.service';
import { AppState } from '../../../../../../../state/app.state';
import { createSelectAvailableTasks } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-choose-task-popup',
    imports: [],
    templateUrl: './choose-task-popup.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
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
        taskId: Task['id']
    ) => void;

    /** Available tasks, grouped by their containing state machine */
    public readonly availableTasks!: Signal<
        { stateMachine: StateMachine; tasks: Task[] }[]
    >;

    public assignTask(stateMachineId: StateMachine['id'], taskId: Task['id']) {
        this.assignTaskCallback(stateMachineId, taskId);
        this.popupService.submitPopup();
    }

    ngOnInit(): void {
        // @ts-expect-error deferred initialization, depends on technicalChallengeId
        this.availableTasks = this.store.selectSignal(
            createSelectAvailableTasks(this.technicalChallengeId)
        );
    }
}
