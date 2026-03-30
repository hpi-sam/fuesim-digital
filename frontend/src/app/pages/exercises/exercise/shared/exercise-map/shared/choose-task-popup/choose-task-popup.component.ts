import { Component, inject, OnInit, Signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { Task, TechnicalChallengeId, UUID } from 'fuesim-digital-shared';
import { PopupService } from '../../utility/popup.service';
import { AppState } from '../../../../../../../state/app.state';
import { createSelectAvailableTasks } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-choose-task-popup',
    imports: [],
    templateUrl: './choose-task-popup.component.html',
    styleUrl: './choose-task-popup.component.scss',
})
export class ChooseTaskPopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);

    public technicalChallengeId!: TechnicalChallengeId;
    public personnelId!: UUID;
    public assignTaskCallback!: (taskId: UUID) => void;

    public readonly availableTasks!: Signal<Task[]>;

    public assignTask(taskId: UUID) {
        this.assignTaskCallback(taskId);
        this.popupService.submitPopup();
    }

    ngOnInit(): void {
        // @ts-expect-error first assign
        this.availableTasks = this.store.selectSignal(
            createSelectAvailableTasks(this.technicalChallengeId)
        );
    }
}
