import { Directive } from '@angular/core';
import type { AbstractControl, Validator } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import { CustomValidators } from './custom-validators';

@Directive({
    selector: '[appIntegerValidator]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: IntegerValidatorDirective,
            multi: true,
        },
    ],
})
export class IntegerValidatorDirective implements Validator {
    private readonly validator = CustomValidators.integerValidator();

    validate(control: AbstractControl) {
        return this.validator(control);
    }
}
