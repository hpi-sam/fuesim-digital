import type { WritableDraft } from 'immer';
import { produce } from 'immer';
import type { ExerciseState } from '../state.js';
import { sleep } from '../utils/index.js';
import type { ExerciseAction } from './action-reducers/index.js';
import { applyAction } from './reduce-exercise-state.js';

/**
 * @param callback a function that is called at the end of every second in the exerciseState with the respective state at this time. The time itself can be get via `state.currentTime`. If this function returns true, the loop breaks.
 *
 * This function is asynchronous to not block the main thread. You should therefore always await it, if you want to make use of side-effects from {@link callback}.
 */
export async function loopTroughTime(
    currentState: WritableDraft<ExerciseState>,
    actions: readonly ExerciseAction[],
    callback: (stateAtTime: ExerciseState) => boolean
) {
    for (const [i, action] of actions.entries()) {
        applyAction(currentState, action);
        const nextAction = actions[i + 1];
        // Because this action type is the only one that increases the currentTime
        // and we always want the state after the last action at the currentTime
        if (!nextAction || nextAction.type === '[Exercise] Tick') {
            if (callback(currentState)) {
                return;
            }
        }
        // Do not block the main thread for too long
        if (i % 100 === 0) {
            // eslint-disable-next-line no-await-in-loop
            await sleep(0);
        }
    }
}

/**
 * @param actions all the actions that were applied to the {@link initialState} to get to the present state
 * @returns the last state that still is at the provided {@link time} and the index in {@link actions} of the last action that was still applied to the state at this time.
 */
export function jumpToTime(
    initialState: ExerciseState,
    actions: readonly ExerciseAction[],
    time: number
): { stateAtTime: ExerciseState; lastAppliedActionIndex: number } {
    let lastAppliedActionIndex = 0;
    // TODO: find a heuristic for whether using produce or deepCloning it
    // Default is produce
    const stateAtTime = produce(initialState, (draftState) => {
        for (const action of actions) {
            applyAction(draftState, action);
            const nextAction = actions[lastAppliedActionIndex + 1];
            // Because this action type is the only one that increases the currentTime
            // and we always want the state after the last action at the currentTime
            if (
                nextAction?.type === '[Exercise] Tick' &&
                draftState.currentTime >= time
            ) {
                break;
            }
            lastAppliedActionIndex++;
        }
    });
    return {
        lastAppliedActionIndex,
        stateAtTime,
    };
}
