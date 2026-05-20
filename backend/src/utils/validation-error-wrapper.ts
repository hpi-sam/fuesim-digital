import type { ZodError } from 'zod';
import type { ValidationError } from 'class-validator';

export class ValidationErrorWrapper extends Error {
    public constructor(
        public readonly error: (ValidationError | ZodError | string)[]
    ) {
        super('Errors occurred while validating');
    }
}
