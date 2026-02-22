import {
    Component,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { disabled, form, FormField } from '@angular/forms/signals';
import {
    cloneDeepMutable,
    MaterialTemplate,
    uuid,
} from 'fuesim-digital-shared';
import { CaterForFormComponent } from '../cater-for-form/cater-for-form.component';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { MessageService } from '../../../../../../../core/messages/message.service';
import { getImageAspectRatio } from '../../../../../../../shared/functions/get-image-aspect-ratio';
import { ImagePartialFormComponent } from '../image-partial-form/image-partial-form.component';
import { MarketplaceFormSubmitButtonBarComponent } from '../../submit-button-bar/submit-button-bar.component';

@Component({
    selector: 'app-material-template-form',
    templateUrl: './material-template-form.component.html',
    styleUrl: './material-template-form.component.scss',
    imports: [
        CaterForFormComponent,
        DisplayModelValidationComponent,
        FormField,
        ImagePartialFormComponent,
        MarketplaceFormSubmitButtonBarComponent,
    ],
})
export class MaterialTemplateFormComponent implements BaseVersionedElementSubmodal<MaterialTemplate> {
    private readonly messageService = inject(MessageService);

    public readonly data =
        input.required<VersionedElementModalData<MaterialTemplate>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<MaterialTemplate>();
    public readonly discardChanges = output();

    private readonly values = signal<MaterialTemplate>({
        id: uuid(),
        canCaterFor: {
            green: 0,
            yellow: 0,
            red: 0,
            logicalOperator: 'and',
        },
        name: '',
        type: 'materialTemplate',
        image: {
            url: '',
            aspectRatio: 1,
            height: 100,
        },
        overrideTreatmentRange: 0,
        treatmentRange: 0,
    });

    public readonly materialForm = form(this.values, (schema) => {
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
        const valuesOnSubmit = cloneDeepMutable(this.materialForm().value());
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
