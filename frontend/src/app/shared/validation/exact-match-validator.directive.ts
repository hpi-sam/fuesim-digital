import type { OnChanges } from '@angular/core';
import { Directive, Input } from '@angular/core';
import type { AbstractControl, Validator, ValidatorFn } from '@angular/forms';
import { NG_VALIDATORS } from '@angular/forms';
import type { SimpleChangesGeneric } from '../types/simple-changes-generic';
import { CustomValidators } from './custom-validators';

@Directive({
    selector: '[appExactMatchValidator]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: ExactMatchValidatorDirective,
            multi: true,
        },
    ],
    standalone: false,
})
export class ExactMatchValidatorDirective implements Validator, OnChanges {
    private validator!: ValidatorFn;

    /**
     * The string to match
     */
    @Input() appExactMatchValidator!: string;

    ngOnChanges(changes: SimpleChangesGeneric<this>): void {
        this.validator = CustomValidators.exactMatchValidator(
            this.appExactMatchValidator
        );
    }

    validate(control: AbstractControl) {
        return this.validator(control);
    }
}
