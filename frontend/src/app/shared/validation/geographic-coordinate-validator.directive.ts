import { Directive } from '@angular/core';
import type { AbstractControl, Validator } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import { CustomValidators } from './custom-validators';

@Directive({
    selector: '[appGeographicCoordinateValidator]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: GeographicCoordinateDirective,
            multi: true,
        },
    ],
})
export class GeographicCoordinateDirective implements Validator {
    private readonly validator =
        CustomValidators.geographicCoordinateValidator();

    validate(control: AbstractControl) {
        return this.validator(control);
    }
}
