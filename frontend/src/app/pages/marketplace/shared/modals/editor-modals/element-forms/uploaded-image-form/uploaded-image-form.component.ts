import {
    Component,
    inject,
    input,
    signal,
    ChangeDetectionStrategy,
    effect,
    computed,
} from '@angular/core';
import {
    uuid,
    UploadedImage,
    allowedImageFileTypes,
    UploadedImageUploadInput,
    stripEntityFromElementSchema,
    uploadedImageSchema,
    cloneDeepMutable,
} from 'fuesim-digital-shared';
import {
    disabled,
    form,
    FormField,
    validateStandardSchema,
} from '@angular/forms/signals';
import {
    BaseVersionedElementSubmodal,
    FormOutputInjectionToken,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { MessageService } from '../../../../../../../core/messages/message.service';
import { CollectionService } from '../../../../../../../core/collection.service';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component.js';
import { MarketplaceFormSubmitButtonBarComponent } from '../../submit-button-bar/submit-button-bar.component.js';

@Component({
    selector: 'app-uploaded-image-form',
    templateUrl: './uploaded-image-form.component.html',
    styleUrl: './uploaded-image-form.component.scss',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        DisplayModelValidationComponent,
        MarketplaceFormSubmitButtonBarComponent,
        FormField,
    ],
})
export class UploadedImageFormComponent implements BaseVersionedElementSubmodal<UploadedImage> {
    private readonly messageService = inject(MessageService);
    private readonly collectionService = inject(CollectionService);

    public readonly data =
        input.required<VersionedElementModalData<UploadedImage>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);
    readonly currentlyDragging = signal<boolean>(false);

    public readonly formOutput = inject(FormOutputInjectionToken);

    allowedImageFileTypes = allowedImageFileTypes;

    public readonly values = signal<UploadedImage>({
        id: uuid(),
        type: 'uploadedImage',
        name: '',
        aspectRatio: 1,
    });

    public readonly uploadedImageUrl = computed(() => {
        const data = this.data();
        if (data.mode !== 'create')
            return CollectionService.getUploadedImageUrl(
                data.element.versionId
            );
        return '';
    });

    public readonly uploadedImageForm = form(this.values, (schema) => {
        disabled(schema, { when: () => this.disabled() });
        validateStandardSchema(
            schema,
            stripEntityFromElementSchema(uploadedImageSchema)
        );
    });

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.mode !== 'create') {
                this.values.set(cloneDeepMutable(data.element.content));
            }
        });
    }

    onDragover(e: Event) {
        e.preventDefault();
        this.currentlyDragging.set(true);
    }

    onDragleave(e: Event) {
        e.preventDefault();
        this.currentlyDragging.set(false);
    }

    // validate what was dropped
    async onDropped(e: Event) {
        console.log('DROP');
        e.preventDefault();
        this.currentlyDragging.set(false);

        const de = e as DragEvent;
        const files = de.dataTransfer?.files ? [...de.dataTransfer.files] : [];
        console.log(files);
        if (files.length === 0) {
            return;
        }

        if (files.length > 1) {
            console.warn(
                'More than one file dropped. You cannot do that, dammit!!!'
            );
            return;
        }

        const file = files[0]!;

        if (!allowedImageFileTypes.includes(file.type)) {
            this.messageService.postMessage({
                title: 'Die hochgeladene Datei hat kein unterstütztes Bildformat.',
                color: 'danger',
                body: `Unterstützte Formate: ${allowedImageFileTypes.join(', ')}`,
            });
        }

        await this.createImage(file);
    }

    // almost no validation is needed here
    async onSelected(e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target.files?.length) return;

        await this.createImage(target.files[0]!);
    }

    public async createImage(file: File) {
        const data = {
            id: uuid(),
            type: 'uploadedImage',
            name: file.name,
            file: new Uint8Array(await file.arrayBuffer()),
        } satisfies UploadedImageUploadInput;
        await this.collectionService.uploadImage(
            this.data().collection.entityId,
            data
        );
        this.formOutput.discardChanges();
    }

    public async submitData() {
        this.formOutput.dataSubmit(this.uploadedImageForm().value());
    }
}
