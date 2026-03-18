import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Task, TechnicalChallengeId, UUID } from 'fuesim-digital-shared';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PopupService } from '../../utility/popup.service';
import { AppState } from '../../../../../../../state/app.state';
import { ExerciseService } from '../../../../../../../core/exercise.service';
import { createSelectAvailableTasks } from '../../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-choose-task-popup',
    imports: [AsyncPipe],
    templateUrl: './choose-task-popup.component.html',
    styleUrl: './choose-task-popup.component.scss',
})
export class ChooseTaskPopupComponent implements OnInit {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly popupService = inject(PopupService);
    private readonly exerciseService = inject(ExerciseService);

    public technicalChallengeId!: TechnicalChallengeId;
    public personnelId!: UUID;
    public assignTaskCallback!: (taskId: UUID) => void;

    public availableTasks$!: Observable<Task[]>;

    public assignTask(taskId: UUID) {
        this.assignTaskCallback(taskId);
        this.popupService.submitPopup();
    }

    ngOnInit(): void {
        this.availableTasks$ = this.store.select(
            createSelectAvailableTasks(this.technicalChallengeId)
        );
    }
}
