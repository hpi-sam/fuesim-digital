import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
    selector: 'app-display-model-validation',
    templateUrl: './display-model-validation.component.html',
    styleUrls: ['./display-model-validation.component.scss'],
    standalone: false,
})
export class DisplayModelValidationComponent {
    field = input.required<FieldState<any>>();
}
