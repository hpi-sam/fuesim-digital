import {
    Component,
    computed,
    effect,
    input,
    OnInit,
    output,
    signal,
} from '@angular/core';
import { VersionedElementModalData } from '../versioned-element-modal/versioned-element-modal.component';
import {
    AlarmGroup,
    AlarmGroupVehicle,
    cloneDeepMutable,
    ElementDto,
    ElementVersionId,
    Marketplace,
    TypedElementDto,
    uuid,
    VehicleTemplate,
} from 'fuesim-digital-shared';
import { MapEditorCardComponent } from '../../../../shared/components/map-editor-card/map-editor-card.component';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ValuesPipe } from '../../../../shared/pipes/values.pipe';
import { JsonPipe } from '@angular/common';
import { BaseVersionedElementSubmodal } from '../base-versioned-element-submodal';

@Component({
    selector: 'app-alarmgroup-element-modal',
    imports: [
        MapEditorCardComponent,
        DisplayValidationComponent,
        FormsModule,
        NgbDropdownModule,
        ValuesPipe,
        JsonPipe,
    ],
    templateUrl: './alarmgroup-element-modal.component.html',
    styleUrl: './alarmgroup-element-modal.component.scss',
})
export class AlarmgroupElementModalComponent
    implements BaseVersionedElementSubmodal<AlarmGroup>
{
    public data = input.required<VersionedElementModalData<any>>();
    public btnText = input.required<string>();

    public disabled = input<boolean>(false);

    public submit = output<AlarmGroup>();

    public values = signal<AlarmGroup>({
        id: uuid(),
        type: 'alarmGroup',
        alarmGroupVehicles: {},
        name: '',
        triggerCount: 0,
        triggerLimit: null,
    });

    public availableVehicles = computed(() => {
        const vehicles = this.data().availableCollectionElements;
        return vehicles.filter(
            (v) => v.content.type === 'vehicleTemplate'
        ) as TypedElementDto<VehicleTemplate>[];
    });

    constructor() {
        effect(() => {
            const data = this.data();
            if (data.isEditMode) {
                this.values.set(
                    cloneDeepMutable(data.element.content as AlarmGroup)
                );
            }
        });
    }

    public addVehicle(vehicle: TypedElementDto<VehicleTemplate>) {
        const id = uuid();
        this.values.update((ag) => ({
            ...ag,
            alarmGroupVehicles: {
                ...ag.alarmGroupVehicles,
                [id]: {
                    vehicleTemplateId: vehicle.versionId,
                    id,
                    name: vehicle.content.name,
                    time: 0,
                },
            },
        }));
    }

    public removeVehicle(id: string) {
        this.values.update((ag) => {
            const newAlarmGroupVehicles = { ...ag.alarmGroupVehicles };
            delete newAlarmGroupVehicles[id];
            return {
                ...ag,
                alarmGroupVehicles: newAlarmGroupVehicles,
            };
        });
    }

    public getAvailableVehicleByVersionId(
        versionId: ElementVersionId
    ): TypedElementDto<VehicleTemplate> | undefined {
        return this.availableVehicles().find(
            (v) => v.versionId === versionId
        ) as TypedElementDto<VehicleTemplate> | undefined;
    }

    public submitData() {
        this.submit.emit(this.values());
    }
}
