import {
    Component,
    computed,
    inject,
    linkedSignal,
    model,
    OnDestroy,
    OnInit,
    ChangeDetectionStrategy,
    ViewEncapsulation,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { FormsModule } from '@angular/forms';
import type {
    UploadedImage,
    UserGeneratedContent,
} from 'fuesim-digital-shared';
import { isActive } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppState } from '../../../state/app.state';
import { selectCurrentMainRole } from '../../../state/application/selectors/shared.selectors';
import { openUploadedImagePickerModal } from '../../../pages/marketplace/shared/modals/uploaded-image-picker-modal/uploaded-image-picker-modal.component.js';
import { selectUploadedImages } from '../../../state/application/selectors/exercise.selectors.js';
import { CollectionService } from '../../../core/collection.service.js';

@Component({
    selector: 'app-user-generated-content-editor',
    templateUrl: './user-generated-content-editor.component.html',
    styleUrls: ['./user-generated-content-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgxEditorModule, FormsModule],
    encapsulation: ViewEncapsulation.None,
})
export class UserGeneratedContentEditorComponent implements OnInit, OnDestroy {
    private readonly store = inject<Store<AppState>>(Store);
    private readonly ngbModalService = inject(NgbModal);

    readonly userGeneratedContent = model.required<UserGeneratedContent>();

    public readonly availableUploadedImages =
        this.store.selectSignal(selectUploadedImages);

    readonly editorContent = linkedSignal<string>(
        () => this.userGeneratedContent().content
    );
    public readonly currentRole = this.store.selectSignal(
        selectCurrentMainRole
    );
    public readonly isChanged = computed<boolean>(
        () => this.editorContent() !== this.userGeneratedContent().content
    );
    editor!: Editor;
    toolbar: Toolbar = [
        ['bold', 'italic'],
        ['underline', 'strike'],
        ['image'],
        ['blockquote'],
        ['ordered_list', 'bullet_list'],
        ['link'],
        ['text_color', 'background_color'],
        ['align_left', 'align_center', 'align_right', 'align_justify'],
    ];

    async ngOnInit(): Promise<void> {
        this.editor = new Editor();
    }

    ngOnDestroy(): void {
        this.editor.destroy();
    }

    public submit(): void {
        this.userGeneratedContent.set({
            ...this.userGeneratedContent(),
            content: this.editorContent(),
        });
    }

    chooseImageFromCollection() {
        const componentInstance = openUploadedImagePickerModal(
            this.ngbModalService,
            Object.values(this.availableUploadedImages())
        );
        componentInstance.imageChosen.subscribe(
            (uploadedImage: UploadedImage) => {
                console.log(uploadedImage);
                this.editor.commands
                    .insertImage(
                        CollectionService.getUploadedImageUrl(uploadedImage.id)
                    )
                    .exec();
            }
        );
    }

    protected readonly isActive = isActive;
}
