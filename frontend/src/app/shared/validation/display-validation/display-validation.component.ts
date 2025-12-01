import { Input, Component } from '@angular/core';
import { NgModel } from '@angular/forms';
import type { CustomValidationErrors } from '../custom-validation-errors';

@Component({
    selector: 'app-display-validation',
    templateUrl: './display-validation.component.html',
    styleUrls: ['./display-validation.component.scss'],
    standalone: false,
})
export class DisplayValidationComponent {
    @Input() ngModelInput!: NgModel;

    get errors(): CustomValidationErrors | null {
        return this.ngModelInput.errors as CustomValidationErrors | null;
    }
}
