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
    defaultMaterialTemplatesById,
    defaultPersonnelTemplatesById,
    uuid,
    type MaterialTemplate,
    type PersonnelTemplate,
    type VehicleTemplate,
} from 'fuesim-digital-shared';
import { WritableDraft } from 'immer';
import { FormsModule } from '@angular/forms';

import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
    disabled,
    form,
    FormField,
    min,
    required,
} from '@angular/forms/signals';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { MessageService } from '../../../../../../../core/messages/message.service';
import { AutofocusDirective } from '../../../../../../../shared/directives/autofocus.directive';
import { getImageAspectRatio } from '../../../../../../../shared/functions/get-image-aspect-ratio';
import { ValuesPipe } from '../../../../../../../shared/pipes/values.pipe';
import { MapEditorCardComponent } from '../../../../../../../shared/components/map-editor-card/map-editor-card.component';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-vehicle-template-form-marketplace',
    imports: [
        DisplayModelValidationComponent,
        FormsModule,
        NgbDropdownModule,
        AutofocusDirective,
        MapEditorCardComponent,
        ValuesPipe,
        FormField,
    ],
    templateUrl: './vehicle-template-form.component.html',
    styleUrls: ['./vehicle-template-form.component.scss'],
})
export class VehicleTemplateFormMarketplaceComponent implements BaseVersionedElementSubmodal<VehicleTemplate> {
    private readonly messageService = inject(MessageService);

    public readonly data =
        input.required<VersionedElementModalData<VehicleTemplate>>();
    public readonly values = signal<WritableDraft<VehicleTemplate>>({
        type: 'vehicleTemplate',
        id: uuid(),
        image: {
            url: '',
            aspectRatio: 1,
            height: 100,
        },
        materialTemplateIds: [],
        personnelTemplateIds: [],
        name: '',
        patientCapacity: 0,
        vehicleType: '',
    });
    public readonly btnText = input<string>('Änderungen speichern');
    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<VehicleTemplate>();

    public readonly vehicleForm = form(this.values, (schema) => {
        disabled(schema, this.disabled);
        required(schema.name);
        required(schema.vehicleType);
        required(schema.image.url);
        required(schema.image.height);
        min(schema.image.height, 1);
        min(schema.patientCapacity, 0);
        required(schema.patientCapacity);
    });

    public materialTemplates = defaultMaterialTemplatesById;
    public personnelTemplates = defaultPersonnelTemplatesById;

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.mode !== 'create') {
                this.values.set(cloneDeepMutable(data.element.content));
            }
        });
    }

    /**
     * Emits the changed values via submitVehicleTemplate
     * This method must only be called if all values are valid
     */
    public async submitData() {
        const valuesOnSubmit = cloneDeepMutable(this.vehicleForm().value());
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

    public getPersonnelTemplateById(id: string) {
        return this.personnelTemplates[id];
    }

    public getMaterialTemplateById(id: string) {
        return this.materialTemplates[id];
    }

    public addPersonnel(personnelTemplate: PersonnelTemplate) {
        this.vehicleForm.personnelTemplateIds().value.update((ids) => {
            ids.push(personnelTemplate.id);
            return ids;
        });
    }

    public removePersonnel(index: number) {
        this.vehicleForm.personnelTemplateIds().value.update((ids) => {
            ids.splice(index, 1);
            return ids;
        });
    }

    public addMaterial(materialTemplate: MaterialTemplate) {
        this.vehicleForm.materialTemplateIds().value.update((ids) => {
            ids.push(materialTemplate.id);
            return ids;
        });
    }

    public removeMaterial(index: number) {
        this.vehicleForm.materialTemplateIds().value.update((ids) => {
            ids.splice(index, 1);
            return ids;
        });
    }
}
