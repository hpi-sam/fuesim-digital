import type { ExerciseState } from '../state.js';
import type { Client } from '../models/client.js';
import {
    type ExerciseAction,
    getExerciseActionTypeDictionary,
} from './action-reducers/action-reducers.js';
import type { ReducerRights } from './action-reducer.js';

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
    const reducer = exerciseActionTypeDictionary[action.type];
    let rights = reducer.rights as ReducerRights<
        InstanceType<typeof reducer.action>
    >;

    if (typeof rights === 'function') {
        rights = rights(state, client, action);
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
