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
export function validateExerciseAction(maybeAction: unknown): Error | true {
    // Be aware that `maybeAction` could be any json object. We need to program defensively here.
    // eslint-disable-next-line
    const actionType = (maybeAction as { type?: string })?.type;
    if (typeof actionType !== 'string') {
        return new Error('Action type is not a string.');
    }
    if (!isActionType(actionType)) {
        // Defensive, see comment above
        // if the maybeAction.type is not a valid maybeAction type, the actionClass is undefined.
        // Defensive, see comment above
        return new Error(`Unknown action type: ${actionType}`);
    }

    const reducer = lookupReducerFor(actionType);
    const result = reducer.actionSchema.safeParse(maybeAction);
    if (result.error) {
        return result.error;
    }

    return true;
}

// Decorators for validation
// Placed here instead of in utils/validators to prevent circular imports

export function isExerciseAction(value: unknown): value is ExerciseAction {
    return validateExerciseAction(value) === true;
}
