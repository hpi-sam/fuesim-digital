import { produce, type WritableDraft } from 'immer';
import type { ExerciseState } from '../state.js';
import {
    type ExerciseAction,
    lookupReducerFor,
} from './action-reducers/action-reducers.js';

/**
 * A pure reducer function that applies the action on the state without mutating it.
 * @param state The current state (immutable)
 * @param action The action to apply on the current state
 * @throws {ReducerError} if the action is not applicable on the current state
 * @returns the new state
 */
export function reduceExerciseState(
    state: ExerciseState,
    action: ExerciseAction
): ExerciseState {
    // use immer to convert mutating operations to immutable ones (https://immerjs.github.io/immer/produce)
    return produce(state, (draftState) => applyAction(draftState, action));
}

/**
 * Applies the action on the state by mutating it.
 * @param draftState The current state (mutable)
 * @param action The action to apply on the current state
 * @throws {ReducerError} if the action is not applicable on the current state
 */
export function applyAction(
    draftState: WritableDraft<ExerciseState>,
    action: ExerciseAction
): void {
    lookupReducerFor(action.type).reducer(draftState, action);
}
