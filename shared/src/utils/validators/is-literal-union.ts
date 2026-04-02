import type { ValidationOptions, ValidationArguments } from 'class-validator';
import { isIn } from 'class-validator';
import type { UUID } from '../uuid.js';
import { createMapValidator } from './create-map-validator.js';
import type { GenericPropertyDecorator } from './generic-property-decorator.js';
import { makeValidator } from './make-validator.js';

/**
 * A type for validating unions of string literals.
 *
 * @example
 * ````ts
 * type StringLiteralUnion = 'a' | 'b';
 *
 * const stringLiteralUnionAllowedValues: AllowedValues<StringLiteralUnion> = {
 *     a: true,
 *     b: true,
 * };
 *
 * class MyClassToValidate {
 *     @IsLiteralUnion(stringLiteralUnionAllowedValues)
 *     public readonly myString: StringLiteralUnion;
 * }
 *
 * ````
 */
export type AllowedValues<T extends number | string | symbol> = {
    [key in T]: true;
};

export function isLiteralUnion<T extends number | string | symbol>(
    allowedValues: AllowedValues<T>,
    valueToBeValidated: unknown
): boolean {
    return isIn(valueToBeValidated, Object.keys(allowedValues));
}

/**
 * A validator to check whether a property is part of a literal union type.
 *
 * Only literal types that may be keys of objects, i.e. `number`, `string`, and `symbol`, are allowed.
 * @param allowedValues {@link AllowedValues} that specify which values may be present.
 * @param validationOptions {@link ValidationOptions} passed on to `class-validator`.
 * @returns A `class-validator` validator that verifies that the value is in the keys of {@link allowedValues}.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsLiteralUnion<
    T extends number | string | symbol,
    Each extends boolean = false,
>(
    allowedValues: AllowedValues<T>,
    validationOptions?: ValidationOptions & { each?: Each }
): GenericPropertyDecorator<T, Each> {
    return makeValidator<T, Each>(
        'isLiteralUnion',
        (value: unknown, args?: ValidationArguments) =>
            isLiteralUnion<T>(allowedValues, value),
        validationOptions
    );
}

export function isLiteralUnionMap<T extends number | string | symbol, V>(
    allowedValues: AllowedValues<T>,
    valueValidator: (value: unknown) => value is V,
    valueToBeValidated: unknown
): valueToBeValidated is { [key in T]?: UUID } {
    return createMapValidator({
        keyValidator: ((key) => isLiteralUnion(allowedValues, key)) as (
            key: unknown
        ) => key is T,
        valueValidator,
    })(valueToBeValidated);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsLiteralUnionMap<
    K extends number | string | symbol,
    V,
    Each extends boolean = false,
>(
    allowedValues: AllowedValues<K>,
    valueValidator: (value: unknown) => value is V,
    validationOptions?: ValidationOptions & { each?: Each }
): GenericPropertyDecorator<{ [key in K]?: V }, Each> {
    return makeValidator<{ [key in K]?: V }, Each>(
        'isLiteralUnionToIdMap',
        (value: unknown, args?: ValidationArguments) =>
            isLiteralUnionMap<K, V>(allowedValues, valueValidator, value),
        validationOptions
    );
}
