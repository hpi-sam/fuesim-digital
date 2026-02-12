import { plainToInstance } from 'class-transformer';
import type {
    ValidationArguments,
    ValidationError,
    ValidationOptions,
} from 'class-validator';
import { validateSync } from 'class-validator';
import type { ZodError } from 'zod';
import type { GenericPropertyDecorator } from '../utils/validators/generic-property-decorator.js';
import { makeValidator } from '../utils/validators/make-validator.js';
import type { ExerciseAction } from './action-reducers/index.js';
import { isActionType, lookupReducerFor } from './action-reducers/index.js';
import { defaultValidateOptions } from './validation-options.js';

/**
 *
 * @param maybeAction A json object that should be checked for validity.
 * @returns An array of errors validating {@link maybeAction}. An empty array indicates a valid action object.
 */
export function validateExerciseAction(
    maybeAction: unknown
): (ValidationError | ZodError | string)[] {
    // Be aware that `maybeAction` could be any json object. We need to program defensively here.
    // eslint-disable-next-line
    const actionType = (maybeAction as { type?: string })?.type;
    if (typeof actionType !== 'string') {
        return ['Action type is not a string.'];
    }
    if (!isActionType(actionType)) {
        // Defensive, see comment above
        // if the maybeAction.type is not a valid maybeAction type, the actionClass is undefined.
        // Defensive, see comment above
        return [`Unknown action type: ${actionType}`];
    }

    const reducer = lookupReducerFor(actionType);

    // TODO: Remove this after migrating all actions to be schemas
    if ('action' in reducer) {
        const actionClass = reducer.action;
        // This works - no idea about the type error though...
        return validateSync(
            plainToInstance(actionClass, maybeAction),
            defaultValidateOptions
        );
    }
    const result = reducer.actionSchema.safeParse(maybeAction);
    if (result.error) {
        return [result.error];
    }
    return [];
}

// Decorators for validation
// Placed here instead of in utils/validators to prevent circular imports

export function isExerciseAction(value: unknown): value is ExerciseAction {
    return validateExerciseAction(value).length === 0;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsExerciseAction<Each extends boolean>(
    validationOptions?: ValidationOptions & { each?: Each }
): GenericPropertyDecorator<ExerciseAction, Each> {
    return makeValidator<ExerciseAction, Each>(
        'isExerciseAction',
        (value: unknown, args?: ValidationArguments) => isExerciseAction(value),
        validationOptions
    );
}
