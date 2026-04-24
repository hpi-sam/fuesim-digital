import { Component, input } from '@angular/core';
import { NgModel } from '@angular/forms';
import { validationMessages } from 'fuesim-digital-shared';
import type { CustomValidationErrors } from '../custom-validation-errors';

@Component({
    selector: 'app-display-validation',
    templateUrl: './display-validation.component.html',
    styleUrls: ['./display-validation.component.scss'],
})
export class DisplayValidationComponent {
    readonly ngModelInput = input.required<NgModel>();

    get validationMessages() {
        return validationMessages;
    }

    get errors(): CustomValidationErrors | null {
        return this.ngModelInput().errors as CustomValidationErrors | null;
    }
}
