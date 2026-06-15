import { z } from 'zod';
import {
    actionTypeSchema,
    type ExerciseAction,
    lookupReducerFor,
} from './action-reducers/action-reducers.js';

/**
 *
 * @param maybeAction A JSON object that should be checked for validity.
 * @returns An array of errors validating {@link maybeAction}. An empty array indicates a valid action object.
 */
export function validateExerciseAction(maybeAction: object): ExerciseAction {
    const maybeActionWithType = z
        .object({ type: actionTypeSchema })
        .parse(maybeAction);

    const reducer = lookupReducerFor(maybeActionWithType.type);
    return reducer.actionSchema.parse(maybeAction);
}
