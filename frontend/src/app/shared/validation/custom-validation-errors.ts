import type { CustomValidators } from './custom-validators';
import type { ExerciseExistsValidatorError } from './exercise-exists-validator.directive';
import type { ImageExistsValidatorError } from './image-exists-validator.directive';

/**
 * A strongly typed version of the ValidationErrors interface.
 */
export type CustomValidationErrors = Partial<
    UnionToIntersection<
        | AngularValidationErrors
        | Exclude<CustomValidationError, null>
        // These errors are not saved in CustomValidators
        | ExerciseExistsValidatorError
        | ImageExistsValidatorError
    >
>;

type CustomValidator = (typeof CustomValidators)[keyof typeof CustomValidators];
type CustomValidatorFn = ReturnType<CustomValidator>;
type CustomValidationError =
    ReturnType<CustomValidatorFn> extends Promise<any>
        ? Awaited<ReturnType<CustomValidatorFn>>
        : ReturnType<CustomValidatorFn>;

/**
 * The error types of the custom validation errors already implemented by angular
 */
interface AngularValidationErrors {
    pattern: { requiredPattern: string; actualValue: string };
    minlength: { actualLength: number; requiredLength: number };
    maxlength: { actualLength: number; requiredLength: number };
    email: true;
    min: { actual: number; min: number };
    max: { actual: number; max: number };
    required: true;
}

// Utility types
// See https://stackoverflow.com/a/50375286/12698757
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I
) => void
    ? I
    : never;
