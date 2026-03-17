import type { ValidationArguments, ValidationOptions } from 'class-validator';
import { v4 } from 'uuid';
import { z } from 'zod';

/**
 * Generates a v4 uuid
 */
export function uuid(): UUID {
    // this is an extra function to make the imports easier (no `v4 as uuid` that can't be auto-generated)
    return v4();
}

export type UUID = string;

const uuidValidationFailedWithId = (id: string) => `Got malformed id: '${id}'.`;
const uuidValidationFailedMessage: (
    validationArguments: ValidationArguments
) => string = (validationArguments: ValidationArguments) =>
    uuidValidationFailedWithId(String(validationArguments.value));
export const uuidValidationOptions: ValidationOptions = {
    message: uuidValidationFailedMessage,
};
export const uuidArrayValidationOptions: ValidationOptions = {
    ...uuidValidationOptions,
    each: true,
};
export const uuidSchema = z.uuidv4();
