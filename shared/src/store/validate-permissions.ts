import type { Client } from '../models/index.js';
import type { ExerciseState } from '../state.js';
import type { ExerciseAction } from './action-reducers/index.js';
import { getExerciseActionTypeDictionary } from './action-reducers/action-reducers.js';

const exerciseActionTypeDictionary = getExerciseActionTypeDictionary();

/**
 *
 * @param client The {@link Client} that proposed the {@link action}.
 * @param action The {@link ExerciseAction} that got proposed.
 * @param state The current {@link ExerciseState} before the {@link action} gets applied.
 * @returns true when the {@link action} can be applied, false otherwise.
 */
export function validatePermissions(
    client: Client,
    action: ExerciseAction,
    state: ExerciseState
) {
    const rights = exerciseActionTypeDictionary[action.type].rights;

    if (rights === 'server') {
        return false;
    }
    if (
        client.role.mainRole === 'participant' &&
        (rights === 'participant' || rights === client.role.specificRole)
    ) {
        return true;
    }
    if (client.role.mainRole === 'trainer') {
        return true;
    }

    return false;
}
