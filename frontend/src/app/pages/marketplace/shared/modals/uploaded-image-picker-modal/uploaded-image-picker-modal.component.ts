import {
    ChangeDetectionStrategy,
    Component,
    inject,
    output,
    signal,
} from '@angular/core';
import { NgbActiveModal, type NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UploadedImage } from 'fuesim-digital-shared';
import { CollectionService } from '../../../../../core/collection.service.js';

export function openUploadedImagePickerModal(
    ngbModalService: NgbModal,
    uploadedImages: UploadedImage[]
) {
    const modalRef = ngbModalService.open(UploadedImagePickerModalComponent, {
        size: 'lg',
    });
    const componentInstance =
        modalRef.componentInstance as UploadedImagePickerModalComponent;
    componentInstance.uploadedImages.set(uploadedImages);
    return componentInstance;
}

@Component({
    selector: 'app-uploaded-image-picker-modal',
    templateUrl: './uploaded-image-picker-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
})
class UploadedImagePickerModalComponent {
    private readonly activeModal = inject(NgbActiveModal);

    readonly imageChosen = output<UploadedImage>();

    readonly uploadedImages = signal<UploadedImage[]>([]);

    getUploadedImageUrl = CollectionService.getUploadedImageUrl;

    public close(): void {
        this.activeModal.close();
    }

    protected async chooseImage(uploadedImage: UploadedImage) {
        this.imageChosen.emit(uploadedImage);
        this.close();
    }
}
