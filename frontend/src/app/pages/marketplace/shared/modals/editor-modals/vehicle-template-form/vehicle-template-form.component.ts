import {
    Component,
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
    type VehicleTemplate,
} from 'fuesim-digital-shared';
import { cloneDeep } from 'lodash-es';
import { WritableDraft } from 'immer';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';

import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../base-versioned-element-submodal';
import { MessageService } from '../../../../../../core/messages/message.service';
import { AutofocusDirective } from '../../../../../../shared/directives/autofocus.directive';
import { getImageAspectRatio } from '../../../../../../shared/functions/get-image-aspect-ratio';
import { ValuesPipe } from '../../../../../../shared/pipes/values.pipe';
import { DisplayValidationComponent } from '../../../../../../shared/validation/display-validation/display-validation.component';
import { AppState } from '../../../../../../state/app.state';
import {
    selectMaterialTemplates,
    selectPersonnelTemplates,
} from '../../../../../../state/application/selectors/exercise.selectors';

@Component({
    selector: 'app-vehicle-template-form-marketplace',
    imports: [
        DisplayValidationComponent,
        FormsModule,
        NgbDropdownModule,
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

    public materialTemplates$ = this.store.select(selectMaterialTemplates);
    public personnelTemplates$ = this.store.select(selectPersonnelTemplates);

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.mode !== 'create') {
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
        const valuesOnSubmit = cloneDeep(this.values());
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

    public addPersonnel(personnelTemplate: PersonnelTemplate) {
        this.values().personnelTemplateIds.push(personnelTemplate.id);
    }

    public removePersonnel(index: number) {
        this.values().personnelTemplateIds.splice(index, 1);
    }

    public addMaterial(materialTemplate: MaterialTemplate) {
        this.values().materialTemplateIds.push(materialTemplate.id);
    }

    public removeMaterial(index: number) {
        this.values().materialTemplateIds.splice(index, 1);
    }
}
