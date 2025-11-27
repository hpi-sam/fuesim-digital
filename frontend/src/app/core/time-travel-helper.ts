import type {
    ExerciseState,
    ExerciseTimeline,
} from 'digital-fuesim-manv-shared';
import { BehaviorSubject } from 'rxjs';
import { TimeJumpHelper } from './time-jump-helper';

export class TimeTravelHelper {
    private readonly timeJumpHelper = new TimeJumpHelper(this.exerciseTimeLine);

    constructor(
        presentState: ExerciseState,
        private readonly exerciseTimeLine: ExerciseTimeline,
        private readonly setState: (state: ExerciseState) => void
    ) {
        // Travel to the start of the exercise
        this.setTimeConstraints({
            start: exerciseTimeLine.initialState.currentTime,
            current: exerciseTimeLine.initialState.currentTime,
            end: presentState.currentTime,
        });
        this.setState(exerciseTimeLine.initialState);
        this.timeJumpHelper = new TimeJumpHelper(exerciseTimeLine);
        this.jumpToTime(this.timeConstraints.start);
    }

    // Initially set in constructor
    public timeConstraints!: TimeConstraints;
    public readonly timeConstraints$ = new BehaviorSubject<TimeConstraints>(
        this.timeConstraints
    );
    private setTimeConstraints(timeConstraints: TimeConstraints) {
        this.timeConstraints = timeConstraints;
        this.timeConstraints$.next(this.timeConstraints);
    }

    /**
     * @param exerciseTime The time to travel to, if it isn't in the timeConstraints, it will be clamped appropriately
     */
    public async jumpToTime(exerciseTime: number): Promise<void> {
        const clampedTime = Math.max(
            this.timeConstraints.start,
            Math.min(this.timeConstraints.end, exerciseTime)
        );
        this.setTimeConstraints({
            ...this.timeConstraints,
            current: clampedTime,
        });
        // Update the exercise store with the state
        this.setState(this.timeJumpHelper.getStateAtTime(clampedTime));
    }
}

export interface TimeConstraints {
    readonly start: number;
    readonly current: number;
    readonly end: number;
}
