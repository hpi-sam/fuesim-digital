import type { OnChanges } from '@angular/core';
import { Component, inject, input, output } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    MaterialTemplate,
    PersonnelTemplate,
    UUID,
} from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { MessageService } from '../../../../../../core/messages/message.service';
import { getImageAspectRatio } from '../../../../../../shared/functions/get-image-aspect-ratio';
import type { SimpleChangesGeneric } from '../../../../../../shared/types/simple-changes-generic';
import type { AppState } from '../../../../../../state/app.state';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
} from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-template-form',
    templateUrl: './vehicle-template-form.component.html',
    styleUrls: ['./vehicle-template-form.component.scss'],
    standalone: false,
})
export class VehicleTemplateFormComponent implements OnChanges {
    private readonly messageService = inject(MessageService);
    private readonly store = inject<Store<AppState>>(Store);

    readonly initialValues = input.required<EditableVehicleTemplateValues>();
    readonly btnText = input.required<string>();

    /**
     * Emits the changed values
     */
    readonly submitVehicleTemplate = output<ChangedVehicleTemplateValues>();

    public values?: EditableVehicleTemplateValues;

    public materialTemplates$ = this.store.select(selectMaterialTemplates);
    public personnelTemplates$ = this.store.select(selectPersonnelTemplates);

    ngOnChanges(_changes: SimpleChangesGeneric<this>): void {
        this.values = {
            ...this.initialValues(),
            ...this.values,
        };
    }

    /**
     * Emits the changed values via submitVehicleTemplate
     * This method must only be called if all values are valid
     */
    public async submit() {
        if (!this.values) {
            return;
        }
        const valuesOnSubmit = cloneDeep(this.values);
        getImageAspectRatio(valuesOnSubmit.url!)
            .then((aspectRatio) => {
                this.submitVehicleTemplate.emit({
                    name: valuesOnSubmit.name!,
                    type: valuesOnSubmit.type!,
                    url: valuesOnSubmit.url!,
                    aspectRatio,
                    height: valuesOnSubmit.height,
                    patientCapacity: valuesOnSubmit.patientCapacity,
                    materialTemplateIds: valuesOnSubmit.materialTemplates.map(
                        (template) => template.id
                    ),
                    personnelTemplateIds: valuesOnSubmit.personnelTemplates.map(
                        (template) => template.id
                    ),
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

    public addPersonnel(personnelTemplate: PersonnelTemplate) {
        if (!this.values) {
            return;
        }
        this.values.personnelTemplates.push(personnelTemplate);
    }

    public removePersonnel(index: number) {
        if (!this.values) {
            return;
        }
        this.values.personnelTemplates.splice(index, 1);
    }

    public addMaterial(materialTemplate: MaterialTemplate) {
        if (!this.values) {
            return;
        }
        this.values.materialTemplates.push(materialTemplate);
    }

    public removeMaterial(index: number) {
        if (!this.values) {
            return;
        }
        this.values.materialTemplates.splice(index, 1);
    }
}

export interface EditableVehicleTemplateValues {
    name: string | null;
    type: string | null;
    url: string | null;
    height: number;
    patientCapacity: number;
    materialTemplates: MaterialTemplate[];
    personnelTemplates: PersonnelTemplate[];
}

export interface ChangedVehicleTemplateValues {
    name: string;
    type: string;
    url: string;
    aspectRatio: number;
    height: number;
    patientCapacity: number;
    materialTemplateIds: UUID[];
    personnelTemplateIds: UUID[];
}
