import {
    Component,
    input,
    ChangeDetectionStrategy,
    computed,
    inject,
} from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import {
    ElementVersionId,
    ImageProperties,
    TemplateVersion,
    TypedTemplateVersion,
    UploadedImage,
} from 'fuesim-digital-shared';
import type { Immutable } from 'immer';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import { CollectionService } from '../../../../../../../core/collection.service.js';
import { openUploadedImagePickerModal } from '../../../uploaded-image-picker-modal/uploaded-image-picker-modal.component.js';

@Component({
    selector: 'app-image-partial-form',
    templateUrl: './image-partial-form.component.html',
    styleUrl: './image-partial-form.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormField, DisplayModelValidationComponent],
})
export class ImagePartialFormComponent {
    ngbModalService = inject(NgbModal);

    public readonly imageForm =
        input.required<FieldTree<ImageProperties, string>>();
    public readonly availableCollectionElements =
        input.required<Immutable<TemplateVersion[]>>();

    public readonly availableUploadedImages = computed(() =>
        (
            this.availableCollectionElements().filter(
                (v) => v.content.type === 'uploadedImage'
            ) as TypedTemplateVersion<UploadedImage>[]
        ).map((v) => ({ ...v.content, id: v.versionId }))
    );

    chooseImage(elementVersionId: ElementVersionId) {
        this.imageForm()
            .url()
            .value.set(this.getUploadedImageUrl(elementVersionId));
    }

    chooseImageFromCollection() {
        const componentInstance = openUploadedImagePickerModal(
            this.ngbModalService,
            this.availableUploadedImages()
        );
        componentInstance.imageChosen.subscribe(
            (uploadedImage: UploadedImage) => {
                this.chooseImage(uploadedImage.id as ElementVersionId);
            }
        );
    }

    getUploadedImageUrl = CollectionService.getUploadedImageUrl;
}
