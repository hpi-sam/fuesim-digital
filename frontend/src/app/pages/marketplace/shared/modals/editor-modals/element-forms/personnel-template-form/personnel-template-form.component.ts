import {
    Component,
    effect,
    inject,
    input,
    signal,
    ChangeDetectionStrategy,
} from '@angular/core';
import {
    cloneDeepMutable,
    PersonnelTemplate,
    personnelTemplateSchema,
    stripEntityFromElementSchema,
    uuid,
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
    changeDetection: ChangeDetectionStrategy.Eager,
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

    public readonly formOutput = inject(FormOutputInjectionToken);

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
        disabled(schema, { when: () => this.disabled() });
        validateStandardSchema(
            schema,
            stripEntityFromElementSchema(personnelTemplateSchema)
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

        this.formOutput.dataSubmit({
            ...valuesOnSubmit,
            image: {
                ...valuesOnSubmit.image,
                aspectRatio,
            },
        });
    }
}
