import {
    Component,
    computed,
    effect,
    input,
    output,
    signal,
} from '@angular/core';
import {
    AlarmGroup,
    cloneDeepMutable,
    isElementVersionId,
    newAlarmGroupVehicle,
    TypedElementDto,
    uuid,
    VehicleTemplate,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../../base-versioned-element-submodal';
import { MapEditorCardComponent } from '../../../../../../../shared/components/map-editor-card/map-editor-card.component';
import { ValuesPipe } from '../../../../../../../shared/pipes/values.pipe';
import { DisplayModelValidationComponent } from '../../../../../../../shared/validation/display-model-validation/display-model-validation.component';

@Component({
    selector: 'app-alarmgroup-form',
    imports: [
        MapEditorCardComponent,
        DisplayModelValidationComponent,
        FormsModule,
        NgbDropdownModule,
        ValuesPipe,
        FormField,
    ],
    templateUrl: './alarmgroup-form.component.html',
    styleUrl: './alarmgroup-form.component.scss',
})
export class AlarmgroupFormComponent implements BaseVersionedElementSubmodal<AlarmGroup> {
    public readonly data =
        input.required<VersionedElementModalData<AlarmGroup>>();
    public readonly btnText = input.required<string>();

    public readonly disabled = input<boolean>(false);

    public readonly dataSubmit = output<AlarmGroup>();

    public readonly values = signal<AlarmGroup>({
        id: uuid(),
        type: 'alarmGroup',
        alarmGroupVehicles: {},
        name: '',
        triggerCount: 0,
        triggerLimit: null,
    });

    public readonly agForm = form(this.values, (schema) => {
        disabled(schema, this.disabled);
        required(schema.name);
    });

    public readonly availableVehicles = computed(() => {
        const vehicles = this.data().availableCollectionElements;
        return vehicles.filter(
            (v) => v.content.type === 'vehicleTemplate'
        ) as TypedElementDto<VehicleTemplate>[];
    });

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.mode !== 'create') {
                this.values.set(cloneDeepMutable(data.element.content));
            }
        });
    }

    public addVehicle(vehicle: TypedElementDto<VehicleTemplate>) {
        const id = uuid();

        this.agForm.alarmGroupVehicles().value.update((vehicles) => ({
            ...vehicles,
            [id]: newAlarmGroupVehicle(
                vehicle.versionId,
                0,
                vehicle.content.name,
                id
            ),
        }));
    }

    public removeVehicle(id: string) {
        this.agForm.alarmGroupVehicles().value.update((vehicles) => {
            const newVehicles = cloneDeepMutable(vehicles);
            delete newVehicles[id];
            return newVehicles;
        });
    }

    public getAvailableVehicleByVersionId(
        // We cannot assume a VersionedID here, since alarmgroupVehicleId can also be a string (from old versions)
        versionId: string
    ): TypedElementDto<VehicleTemplate> | undefined {
        if (!isElementVersionId(versionId)) return undefined;
        return this.availableVehicles().find((v) => v.versionId === versionId);
    }

    public submitData() {
        this.dataSubmit.emit(this.agForm().value());
    }
}
