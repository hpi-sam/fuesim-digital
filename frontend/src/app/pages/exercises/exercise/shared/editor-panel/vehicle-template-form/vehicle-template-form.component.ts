import type { OnChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import type {
    MaterialTemplate,
    MaterialType,
    PersonnelTemplate,
    PersonnelType,
} from 'digital-fuesim-manv-shared';
import {
    materialTypeNames,
    personnelTypeNames,
} from 'digital-fuesim-manv-shared';
import { cloneDeep } from 'lodash-es';
import type { Observable } from 'rxjs';
import { MessageService } from 'src/app/core/messages/message.service';
import { getImageAspectRatio } from 'src/app/shared/functions/get-image-aspect-ratio';
import type { SimpleChangesGeneric } from 'src/app/shared/types/simple-changes-generic';
import type { AppState } from 'src/app/state/app.state';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
} from 'src/app/state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-template-form',
    templateUrl: './vehicle-template-form.component.html',
    styleUrls: ['./vehicle-template-form.component.scss'],
    standalone: false,
})
export class VehicleTemplateFormComponent implements OnChanges {
    @Input() initialValues!: EditableVehicleTemplateValues;
    @Input() btnText!: string;

    /**
     * Emits the changed values
     */
    @Output() readonly submitVehicleTemplate =
        new EventEmitter<ChangedVehicleTemplateValues>();

    public values?: EditableVehicleTemplateValues;

    public materialTemplates$: Observable<{
        readonly [type in MaterialType]: MaterialTemplate;
    }> = this.store.select(selectMaterialTemplates);
    public personnelTemplates$: Observable<{
        readonly [type in PersonnelType]: PersonnelTemplate;
    }> = this.store.select(selectPersonnelTemplates);

    constructor(
        private readonly messageService: MessageService,
        private readonly store: Store<AppState>
    ) {}

    ngOnChanges(_changes: SimpleChangesGeneric<this>): void {
        this.values = {
            ...this.initialValues,
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
                    materialTypes: valuesOnSubmit.materialTypes,
                    personnelTypes: valuesOnSubmit.personnelTypes,
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

    public addPersonnel(type: PersonnelType) {
        if (!this.values) {
            return;
        }
        this.values.personnelTypes.push(type);
    }

    public removePersonnel(index: number) {
        if (!this.values) {
            return;
        }
        this.values.personnelTypes.splice(index, 1);
    }

    public addMaterial(type: MaterialType) {
        if (!this.values) {
            return;
        }
        this.values.materialTypes.push(type);
    }

    public removeMaterial(index: number) {
        if (!this.values) {
            return;
        }
        this.values.materialTypes.splice(index, 1);
    }

    public get personnelTypeNames() {
        return personnelTypeNames;
    }
    public get materialTypeNames() {
        return materialTypeNames;
    }
}

export interface EditableVehicleTemplateValues {
    name: string | null;
    type: string | null;
    url: string | null;
    height: number;
    patientCapacity: number;
    materialTypes: MaterialType[];
    personnelTypes: PersonnelType[];
}

export interface ChangedVehicleTemplateValues {
    name: string;
    type: string;
    url: string;
    aspectRatio: number;
    height: number;
    patientCapacity: number;
    materialTypes: MaterialType[];
    personnelTypes: PersonnelType[];
}
