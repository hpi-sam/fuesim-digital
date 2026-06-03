import {
    type ExerciseAction,
    isActionType,
    lookupReducerFor,
} from './action-reducers/action-reducers.js';

/**
 *
 * @param maybeAction A json object that should be checked for validity.
 * @returns An array of errors validating {@link maybeAction}. An empty array indicates a valid action object.
 */
export function validateExerciseAction(maybeAction: object): ExerciseAction {
    const actionType = 'type' in maybeAction ? maybeAction.type : null;
    if (typeof actionType !== 'string') {
        throw new TypeError('Action type is not a string.');
    }
    if (!isActionType(actionType)) {
        throw new Error(`Unknown action type: ${actionType}`);
    }

    const reducer = lookupReducerFor(actionType);
    return reducer.actionSchema.parse(maybeAction);
}
