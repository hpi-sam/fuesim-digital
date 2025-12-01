import { Directive } from '@angular/core';
import type { AbstractControl, Validator } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import { CustomValidators } from './custom-validators';

@Directive({
    selector: '[appUrlValidator]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: UrlValidatorDirective,
            multi: true,
        },
    ],
    standalone: false,
})
export class UrlValidatorDirective implements Validator {
    private readonly validator = CustomValidators.urlValidator();

    validate(control: AbstractControl) {
        return this.validator(control);
    }
}
