import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { ImageProperties } from 'fuesim-digital-shared';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-image-partial-form',
    templateUrl: './image-partial-form.component.html',
    styleUrl: './image-partial-form.component.scss',
    imports: [FormField, DisplayModelValidationComponent],
})
export class ImagePartialFormComponent {
    public readonly imageForm =
        input.required<FieldTree<ImageProperties, string>>();
}
