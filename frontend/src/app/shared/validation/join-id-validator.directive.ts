import { Directive } from '@angular/core';
import type { AbstractControl, Validator } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import { CustomValidators } from './custom-validators';

@Directive({
    selector: '[appJoinIdValidator]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: JoinIdDirective,
            multi: true,
        },
    ],
})
export class JoinIdDirective implements Validator {
    private readonly validator = CustomValidators.joinIdValidator();

    validate(control: AbstractControl) {
        return this.validator(control);
    }
}
