import type { ValidationError } from 'class-validator';
import type { ZodError } from 'zod';

export class ValidationErrorWrapper extends Error {
    public constructor(
        public readonly errors: (ValidationError | ZodError | string)[]
    ) {
        super('Errors occurred while validating');
    }
}
