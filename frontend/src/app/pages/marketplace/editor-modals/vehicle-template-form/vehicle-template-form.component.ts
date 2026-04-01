import type { OnChanges, OnInit } from '@angular/core';
import {
    Component,
    EventEmitter,
    Input,
    Output,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
    cloneDeepMutable,
    uuid,
    type MaterialTemplate,
    type PersonnelTemplate,
    type UUID,
    type VehicleTemplate,
} from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { VersionedElementModalData } from '../versioned-element-modal/versioned-element-modal.component';
import { MessageService } from '../../../../core/messages/message.service';
import { getImageAspectRatio } from '../../../../shared/functions/get-image-aspect-ratio';
import { AppState } from '../../../../state/app.state';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
} from '../../../../state/application/selectors/exercise.selectors';
import { WritableDraft } from 'immer';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { AsyncPipe } from '@angular/common';
import { ValuesPipe } from '../../../../shared/pipes/values.pipe';
import { BaseVersionedElementSubmodal } from '../base-versioned-element-submodal';

@Component({
    selector: 'app-vehicle-template-form-marketplace',
    imports: [
        DisplayValidationComponent,
        FormsModule,
        AutofocusDirective,
        AsyncPipe,
        ValuesPipe,
    ],
    templateUrl: './vehicle-template-form.component.html',
    styleUrls: ['./vehicle-template-form.component.scss'],
})
export class VehicleTemplateFormMarketplaceComponent
    implements BaseVersionedElementSubmodal<VehicleTemplate>
{
    private readonly messageService = inject(MessageService);
    private readonly store = inject<Store<AppState>>(Store);

    public data = input.required<VersionedElementModalData<VehicleTemplate>>();
    public values = signal<WritableDraft<VehicleTemplate>>({
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
    public btnText = input<string>('Änderungen speichern');
    public disabled = input<boolean>(false);

    public readonly submit = output<VehicleTemplate>();

    public materialTemplates$ = this.store.select(selectMaterialTemplates);
    public personnelTemplates$ = this.store.select(selectPersonnelTemplates);

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.isEditMode) {
                this.values.set(
                    cloneDeepMutable(data.element.content as VehicleTemplate)
                );
            }
        });
    }

    /**
     * Emits the changed values via submitVehicleTemplate
     * This method must only be called if all values are valid
     */
    public async submitData() {
        if (!this.values) {
            return;
        }
        const valuesOnSubmit = cloneDeep(this.values());
        const aspectRatio = await getImageAspectRatio(
            this.values()?.image.url!
        ).catch((error) => {
            this.messageService.postError({
                title: 'Ungültige URL',
                body: 'Bitte überprüfen Sie die Bildadresse.',
                error,
            });
        });

        this.submit.emit({
            ...valuesOnSubmit,
            image: {
                ...valuesOnSubmit.image,
                aspectRatio: aspectRatio ?? valuesOnSubmit.image.aspectRatio,
            },
        });
    }

    public addPersonnel(personnelTemplate: PersonnelTemplate) {
        if (!this.values) {
            return;
        }
        this.values().personnelTemplateIds.push(personnelTemplate.id);
    }

    public removePersonnel(index: number) {
        if (!this.values) {
            return;
        }
        this.values().personnelTemplateIds.splice(index, 1);
    }

    public addMaterial(materialTemplate: MaterialTemplate) {
        if (!this.values) {
            return;
        }
        this.values().materialTemplateIds.push(materialTemplate.id);
    }

    public removeMaterial(index: number) {
        if (!this.values) {
            return;
        }
        this.values().materialTemplateIds.splice(index, 1);
    }
}
