import {
    Component,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import {
    cloneDeepMutable,
    MapImageTemplate,
    uuid,
} from 'fuesim-digital-shared';
import { form, required, disabled, FormField } from '@angular/forms/signals';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { MessageService } from '../../../../../../../core/messages/message.service';
import { getImageAspectRatio } from '../../../../../../../shared/functions/get-image-aspect-ratio';
import { ImagePartialFormComponent } from '../image-partial-form/image-partial-form.component';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import { MarketplaceFormSubmitButtonBarComponent } from '../../submit-button-bar/submit-button-bar.component';

@Component({
    selector: 'app-map-image-template-form',
    templateUrl: './map-image-template-form.component.html',
    styleUrl: './map-image-template-form.component.scss',
    imports: [
        ImagePartialFormComponent,
        FormField,
        DisplayModelValidationComponent,
        MarketplaceFormSubmitButtonBarComponent,
    ],
})
export class MapImageTemplateFormComponent implements BaseVersionedElementSubmodal<MapImageTemplate> {
    private readonly messageService = inject(MessageService);

    public readonly data =
        input.required<VersionedElementModalData<MapImageTemplate>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<MapImageTemplate>();
    public readonly discardChanges = output();

    public readonly values = signal<MapImageTemplate>({
        id: uuid(),
        type: 'mapImageTemplate',
        name: '',
        image: {
            aspectRatio: 1,
            height: 100,
            url: '',
        },
    });

    public readonly mapImageForm = form(this.values, (schema) => {
        required(schema.name);
        required(schema.image.url);
        required(schema.image.height);

        disabled(schema, this.disabled);
    });

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.mode !== 'create') {
                this.values.set(cloneDeepMutable(data.element.content));
            }
        });
    }
    public async submitData() {
        const valuesOnSubmit = cloneDeepMutable(this.mapImageForm().value());
        const aspectRatio = await getImageAspectRatio(
            this.values().image.url
        ).catch((error) => {
            this.messageService.postError({
                title: 'Ungültige URL',
                body: 'Bitte überprüfen Sie die Bildadresse.',
                error,
            });
            return valuesOnSubmit.image.aspectRatio;
        });

        this.dataSubmit.emit({
            ...valuesOnSubmit,
            image: {
                ...valuesOnSubmit.image,
                aspectRatio,
            },
        });
    }
}
