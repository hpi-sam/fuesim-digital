import type { AbstractControl } from '@angular/forms';
import { z } from 'zod';

export namespace CustomValidators {
    export function exactMatchValidator(stringToMatch: string) {
        return (control: AbstractControl) =>
            stringToMatch !== control.value
                ? { exactMatch: { value: control.value, stringToMatch } }
                : null;
    }
    export function urlValidator() {
        return (control: AbstractControl) =>
            !control.value || z.url().safeParse(control.value).success
                ? null
                : { url: true as const };
    }
    export function integerValidator() {
        return (control: AbstractControl) =>
            !control.value || Number.isInteger(control.value)
                ? null
                : { integer: true as const };
    }
}
