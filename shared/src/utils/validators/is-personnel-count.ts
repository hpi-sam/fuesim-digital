import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { isString, isNumber, min } from 'class-validator';
import type { PersonnelCount } from '../../models/radiogram/personnel-count-radiogram.js';
import { createMapValidator } from './create-map-validator.js';
import type { GenericPropertyDecorator } from './generic-property-decorator.js';
import { makeValidator } from './make-validator.js';

export const isPersonnelCount = createMapValidator<string, number>({
    keyValidator: ((key) => isString(key)) as (key: unknown) => key is string,
    valueValidator: ((value) => isNumber(value) && min(value, 0)) as (
        value: unknown
    ) => value is number,
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsPersonnelCount<Each extends boolean = false>(
    validationOptions?: ValidationOptions & { each?: Each }
): GenericPropertyDecorator<PersonnelCount, Each> {
    return makeValidator<PersonnelCount, Each>(
        'isPersonnelCount',
        (value: unknown, args?: ValidationArguments) => isPersonnelCount(value),
        validationOptions
    );
}
