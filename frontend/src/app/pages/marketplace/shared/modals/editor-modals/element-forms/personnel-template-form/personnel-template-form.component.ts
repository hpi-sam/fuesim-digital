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
    PersonnelTemplate,
    uuid,
} from 'fuesim-digital-shared';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { CaterForFormComponent } from '../cater-for-form/cater-for-form.component';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';
import { getImageAspectRatio } from '../../../../../../../shared/functions/get-image-aspect-ratio';
import { MessageService } from '../../../../../../../core/messages/message.service';
import { ImagePartialFormComponent } from '../image-partial-form/image-partial-form.component';
import { MarketplaceFormSubmitButtonBarComponent } from '../../submit-button-bar/submit-button-bar.component';

@Component({
    selector: 'app-personnel-template-form',
    templateUrl: './personnel-template-form.component.html',
    styleUrl: './personnel-template-form.component.scss',
    imports: [
        CaterForFormComponent,
        FormField,
        DisplayModelValidationComponent,
        ImagePartialFormComponent,
        MarketplaceFormSubmitButtonBarComponent,
    ],
})
export class PersonnelTemplateFormComponent implements BaseVersionedElementSubmodal<PersonnelTemplate> {
    private readonly messageService = inject(MessageService);

    public readonly data =
        input.required<VersionedElementModalData<PersonnelTemplate>>();
    public readonly btnText = input.required<string>();
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<PersonnelTemplate>();
    public readonly discardChanges = output();

    public readonly values = signal<PersonnelTemplate>({
        id: uuid(),
        type: 'personnelTemplate',
        name: '',
        personnelType: '',
        abbreviation: '',
        image: {
            url: '',
            aspectRatio: 1,
            height: 100,
        },
        canCaterFor: {
            green: 0,
            yellow: 0,
            red: 0,
            logicalOperator: 'and',
        },
        overrideTreatmentRange: 0,
        treatmentRange: 0,
    });

    public readonly personnelForm = form(this.values, (schema) => {
        required(schema.name);
        required(schema.abbreviation);
        required(schema.personnelType);
        required(schema.image.url);
        required(schema.image.height);
        required(schema.canCaterFor.red);
        required(schema.canCaterFor.yellow);
        required(schema.canCaterFor.green);
        required(schema.canCaterFor.logicalOperator);
        required(schema.overrideTreatmentRange);
        required(schema.treatmentRange);

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
        const valuesOnSubmit = cloneDeepMutable(this.personnelForm().value());
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
