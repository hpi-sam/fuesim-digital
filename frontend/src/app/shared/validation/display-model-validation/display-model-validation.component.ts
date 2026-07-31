import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FieldState } from '@angular/forms/signals';

@Component({
    selector: 'app-display-model-validation',
    templateUrl: './display-model-validation.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./display-model-validation.component.scss'],
})
export class DisplayModelValidationComponent {
    readonly field = input.required<FieldState<any>>();
    readonly hide = input<boolean>(false);
}
