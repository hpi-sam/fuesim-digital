import type { WritableDraft } from 'immer';
import { freeze, produce } from 'immer';
import type { ExerciseState } from '../state.js';
import type { ExerciseAction } from './action-reducers/index.js';
import { getExerciseActionTypeDictionary } from './action-reducers/index.js';

const exerciseActionTypeDictionary = getExerciseActionTypeDictionary();

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
    // Make sure that the state isn't mutated in the reducer (short circuits if the state is already frozen)
    freeze(state, true);
    // use immer to convert mutating operations to immutable ones (https://immerjs.github.io/immer/produce)
    return produce(state, (draftState) => applyAction(draftState, action));
}

/**
 * Applies the action on the state by mutating it.
 * @param draftState The current state (mutable)
 * @param action The action to apply on the current state
 * @throws {ReducerError} if the action is not applicable on the current state
 * @returns the new state
 */
export function applyAction(
    draftState: WritableDraft<ExerciseState>,
    action: ExerciseAction
) {
    // Make sure that the action isn't mutated in the reducer (short circuits if the action is already frozen)
    freeze(action, true);
    return exerciseActionTypeDictionary[action.type].reducer(
        draftState,
        // typescript doesn't narrow action and the reducer to the correct ones based on action.type
        action as any
    );
}

/**
 * @param actions all the actions that were applied to the {@link initialState} to get to the present state
 * @returns the state after applying all the actions
 */
export function applyAllActions(
    initialState: ExerciseState,
    actions: readonly ExerciseAction[]
): ExerciseState {
    // TODO: find a heuristic for whether using produce or deepCloning it
    // Default is produce
    return produce(initialState, (draftState) => {
        for (const action of actions) {
            applyAction(draftState, action);
        }
    });
}
