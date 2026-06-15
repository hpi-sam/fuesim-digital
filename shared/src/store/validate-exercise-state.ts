import { type ExerciseState, exerciseStateSchema } from '../state.js';

/**
 *
 * @param state An JSON object that should be checked for validity.
 * @returns An array of errors validating {@link action}. An empty array indicates a valid action object.
 */
export function validateExerciseState(state: unknown): ExerciseState {
    return exerciseStateSchema.parse(state);
}
