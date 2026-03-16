import type { OnChanges } from '@angular/core';
import { Component, inject, input, output } from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../../../../../core/messages/message.service';
import { getImageAspectRatio } from '../../../../../../shared/functions/get-image-aspect-ratio';
import type { SimpleChangesGeneric } from '../../../../../../shared/types/simple-changes-generic';
import { ImageExistsValidatorDirective } from '../../../../../../shared/validation/image-exists-validator.directive';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { DisplayValidationComponent } from '../../../../../../shared/validation/display-validation/display-validation.component';
import { IntegerValidatorDirective } from '../../../../../../shared/validation/integer-validator.directive';

@Component({
    selector: 'app-image-template-form',
    templateUrl: './image-template-form.component.html',
    styleUrls: ['./image-template-form.component.scss'],
    imports: [
        FormsModule,
        ImageExistsValidatorDirective,
        AutofocusDirective,
        DisplayValidationComponent,
        IntegerValidatorDirective,
    ],
})
export class ImageTemplateFormComponent implements OnChanges {
    private readonly messageService = inject(MessageService);

    readonly initialValues = input.required<EditableImageTemplateValues>();
    readonly btnText = input.required<string>();

    /**
     * Emits the changed values
     */
    readonly submitImageTemplate = output<ChangedImageTemplateValues>();

    public values?: EditableImageTemplateValues;

    ngOnChanges(changes: SimpleChangesGeneric<this>): void {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!changes.initialValues) {
            return;
        }
        this.values = {
            ...this.initialValues(),
            ...this.values,
        };
    }

    /**
     * Emits the changed values via submitImageTemplate
     * This method must only be called if all values are valid
     */
    public async submit() {
        if (!this.values) {
            return;
        }
        const valuesOnSubmit = cloneDeep(this.values);
        getImageAspectRatio(valuesOnSubmit.url!)
            .then((aspectRatio) => {
                this.submitImageTemplate.emit({
                    url: valuesOnSubmit.url!,
                    name: valuesOnSubmit.name!,
                    aspectRatio,
                    height: valuesOnSubmit.height,
                });
            })
            .catch((error) => {
                this.messageService.postError({
                    title: 'Ungültige URL',
                    body: 'Bitte überprüfen Sie die Bildadresse.',
                    error,
                });
            });
    }
}

export interface EditableImageTemplateValues {
    url: string | null;
    height: number;
    name: string | null;
}

export interface ChangedImageTemplateValues {
    url: string;
    aspectRatio: number;
    height: number;
    name: string;
}
