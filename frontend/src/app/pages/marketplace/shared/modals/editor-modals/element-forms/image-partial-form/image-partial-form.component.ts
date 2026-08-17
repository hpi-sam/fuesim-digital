import {
    Component,
    input,
    ChangeDetectionStrategy,
    computed,
} from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import {
    ImageProperties,
    TemplateVersion,
    TypedTemplateVersion,
    UploadedImage,
} from 'fuesim-digital-shared';
import type { Immutable } from 'immer';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import { CollectionService } from '../../../../../../../core/collection.service.js';

@Component({
    selector: 'app-image-partial-form',
    templateUrl: './image-partial-form.component.html',
    styleUrl: './image-partial-form.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormField, DisplayModelValidationComponent],
})
export class ImagePartialFormComponent {
    public readonly imageForm =
        input.required<FieldTree<ImageProperties, string>>();
    public readonly availableCollectionElements =
        input.required<Immutable<TemplateVersion[]>>();

    public readonly availableUploadedImages = computed(
        () =>
            this.availableCollectionElements().filter(
                (v) => v.content.type === 'uploadedImage'
            ) as TypedTemplateVersion<UploadedImage>[]
    );

    chooseImage(image: TypedTemplateVersion<UploadedImage>) {
        this.imageForm()
            .url()
            .value.set(this.getUploadedImageUrl(image.content));
    }
    getUploadedImageUrl = CollectionService.getUploadedImageUrl;
}
