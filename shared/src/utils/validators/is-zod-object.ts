import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { registerDecorator } from 'class-validator';
import * as z4 from 'zod/v4/core';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function IsZodSchema<T extends z4.$ZodType>(
    zodSchema: T,
    validationOptions?: ValidationOptions
) {
    console.assert(
        !validationOptions?.each,
        'each should not be set to true. Instead use a fitting zod schema'
    );
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsZodSchema',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: {
                ...validationOptions,
                message: (validationArguments) =>
                    `Zod schema validation failed for ${validationArguments.targetName}.${validationArguments.property}.`,
            },
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    const result = z4.safeParse(zodSchema, value);
                    if (!result.success) {
                        console.error(result.error.message);
                    }
                    return result.success;
                },
            },
        });
    };
}
