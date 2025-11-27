import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { ExerciseTimeline } from 'digital-fuesim-manv-shared';
import { freeze } from 'immer';
import { lastValueFrom } from 'rxjs';
import type { AppState } from '../state/app.state';
import {
    createJumpToTimeAction,
    createStartTimeTravelAction,
} from '../state/application/application.actions';
import {
    selectExerciseId,
    selectTimeConstraints,
} from '../state/application/selectors/application.selectors';
import { selectCurrentTime } from '../state/application/selectors/exercise.selectors';
import { selectStateSnapshot } from '../state/get-state-snapshot';
import { httpOrigin } from './api-origins';
import { MessageService } from './messages/message.service';
import { TimeJumpHelper } from './time-jump-helper';

/**
 * This service deals with the timeTravel functionality.
 * During timeTravel, the exerciseState in the central frontend store has been replaced
 * with the state of the exercise at the time the user jumped to.
 * While this service provides an API to jump to a new time (= change the state),
 * all read operations should be done via the central frontend store (with the help of selectors).
 */
@Injectable({
    providedIn: 'root',
})
export class TimeTravelService {
    private timeJumpHelper?: TimeJumpHelper;

    private activatingTimeTravel = false;

    constructor(
        private readonly store: Store<AppState>,
        private readonly httpClient: HttpClient,
        private readonly messageService: MessageService
    ) {}

    /**
     * Use the function in ApplicationService instead
     */
    public async startTimeTravel() {
        this.activatingTimeTravel = true;
        const exerciseId = selectStateSnapshot(selectExerciseId, this.store);
        const exerciseTimeLine = await lastValueFrom(
            this.httpClient.get<ExerciseTimeline>(
                `${httpOrigin}/api/exercise/${exerciseId}/history`
            )
        ).catch((error) => {
            this.stopTimeTravel();
            this.messageService.postError({
                title: 'Die Vergangenheit konnte nicht geladen werden',
                error,
            });
            throw error;
        });
        // Freeze to prevent accidental modification
        freeze(exerciseTimeLine, true);
        // False positive, could be changed by the `catch`
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!this.activatingTimeTravel) {
            // The timeTravel has been stopped during the retrieval of the timeline
            return;
        }
        this.activatingTimeTravel = false;
        this.timeJumpHelper = new TimeJumpHelper(exerciseTimeLine);
        // Travel to the start of the exercise
        // TODO: This should be calculated from the timeline (in the TimeJumpHelper - maybe cache states in between)
        const endTime = selectStateSnapshot(selectCurrentTime, this.store);
        this.store.dispatch(
            createStartTimeTravelAction(exerciseTimeLine.initialState, endTime)
        );
    }

    /**
     * This function can only be called if the timeTravel has previously been started.
     * @param exerciseTime The time to travel to, if it isn't in the timeConstraints, it will be clamped appropriately
     */
    public jumpToTime(exerciseTime: number) {
        const timeConstraints = selectStateSnapshot(
            selectTimeConstraints,
            this.store
        );
        if (!timeConstraints || !this.timeJumpHelper) {
            throw new Error('Start the time travel before jumping to a time!');
        }
        const clampedTime = Math.max(
            timeConstraints.start,
            Math.min(timeConstraints.end, exerciseTime)
        );
        this.store.dispatch(
            createJumpToTimeAction(
                clampedTime,
                this.timeJumpHelper.getStateAtTime(clampedTime)
            )
        );
    }

    /**
     * Use the function in ApplicationService instead
     */
    public stopTimeTravel() {
        this.timeJumpHelper = undefined;
        this.activatingTimeTravel = false;
    }
}
