import type { Client } from '../models/index.js';
import type { ExerciseState } from '../state.js';
import type { ExerciseAction } from './action-reducers/index.js';
import { lookupReducerFor } from './action-reducers/index.js';

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
    const reducer = lookupReducerFor(action.type);
    let rights = reducer.rights;

    if (typeof rights === 'function') {
        rights = rights(client, action);
    }

    if (typeof rights === 'boolean') {
        return rights;
    }

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
