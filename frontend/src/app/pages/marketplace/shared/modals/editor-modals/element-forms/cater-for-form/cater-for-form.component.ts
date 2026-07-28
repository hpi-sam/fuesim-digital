import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { CanCaterFor } from 'fuesim-digital-shared';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-cater-for-form',
    templateUrl: './cater-for-form.component.html',
    styleUrl: './cater-for-form.component.scss',
    imports: [FormField, DisplayModelValidationComponent],
})
export class CaterForFormComponent {
    public readonly caterForForm =
        input.required<FieldTree<CanCaterFor, string>>();
}
