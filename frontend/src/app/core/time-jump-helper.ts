import type {
    ExerciseState,
    ExerciseTimeline,
} from 'digital-fuesim-manv-shared';
import { jumpToTime } from 'digital-fuesim-manv-shared';
import { environment } from 'src/environments/environment';
import { TimeLineCache } from './time-line-cache';

export class TimeJumpHelper {
    private readonly exerciseStateCache = new TimeLineCache<{
        state: ExerciseState;
        /**
         * The index of the first action in the actionsWrappers array that was not applied to this state
         */
        nextActionIndex: number;
    }>();

    constructor(private readonly exerciseTimeLine: ExerciseTimeline) {
        this.exerciseStateCache.add(exerciseTimeLine.initialState.currentTime, {
            state: exerciseTimeLine.initialState,
            nextActionIndex: 0,
        });
    }

    public getStateAtTime(exerciseTime: number): ExerciseState {
        const nearest =
            this.exerciseStateCache.getNearestValueNotAfter(exerciseTime);
        if (!nearest) {
            if (environment.production) {
                return this.exerciseTimeLine.initialState;
            }
            throw Error(`No state found for time ${exerciseTime}`);
        }
        // Apply all the actions
        const actions = this.exerciseTimeLine.actionsWrappers
            // All actions beginning with the actionIndex
            .slice(nearest.nextActionIndex)
            .map(({ action }) => action);
        if (actions.length === 0) {
            return nearest.state;
        }
        // TODO: Maybe do this in a WebWorker?
        const { stateAtTime, lastAppliedActionIndex } = jumpToTime(
            nearest.state,
            actions,
            exerciseTime
        );
        this.exerciseStateCache.add(stateAtTime.currentTime, {
            nextActionIndex:
                nearest.nextActionIndex + lastAppliedActionIndex + 1,
            state: stateAtTime,
        });
        return stateAtTime;
    }
}
