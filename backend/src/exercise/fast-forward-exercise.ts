import type { ExerciseStatus } from 'fuesim-digital-shared';
import type { ActiveExercise } from './active-exercise.js';
import { buildTickAction } from './tick-action.js';

/**
 * Untested, higher values may be possible, but 30min seems like
 * a reasonable limit.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const MAX_FAST_FORWARD_DURATION_MS = 30 * 60 * 1000;

const tickInterval = 1000;

/**
 * Advances {@link activeExercise} from its current state to
 * {@link targetTime} and {@link targetStatus} by repeatedly applying
 * `[Exercise] Tick` actions, then syncing the run/pause status.
 */
export function fastForwardExercise(
    activeExercise: ActiveExercise,
    targetTime: number,
    targetStatus: ExerciseStatus
): void {
    if (
        targetStatus !== 'notStarted' &&
        activeExercise.exercise.currentStateString.currentStatus !== 'running'
    ) {
        activeExercise.applyAction({ type: '[Exercise] Start' }, null);
    }

    while (
        activeExercise.exercise.currentStateString.currentTime < targetTime
    ) {
        const tickAction = buildTickAction(
            activeExercise.getStateSnapshot(),
            tickInterval,
            activeExercise.exercise.tickCounter
        );
        activeExercise.applyAction(tickAction, null);
        activeExercise.exercise.tickCounter++;
    }

    if (targetStatus === 'paused') {
        activeExercise.applyAction({ type: '[Exercise] Pause' }, null);
    }
}
