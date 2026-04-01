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
    ElementVersionId,
    TypedElementDto,
    uuid,
    VehicleTemplate,
} from 'fuesim-digital-shared';
import { FormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { MapEditorCardComponent } from '../../../../shared/components/map-editor-card/map-editor-card.component';
import { DisplayValidationComponent } from '../../../../shared/validation/display-validation/display-validation.component';
import { ValuesPipe } from '../../../../shared/pipes/values.pipe';
import {
    BaseVersionedElementSubmodal,
    VersionedElementModalData,
} from '../base-versioned-element-submodal';

@Component({
    selector: 'app-alarmgroup-element-modal',
    imports: [
        MapEditorCardComponent,
        DisplayValidationComponent,
        FormsModule,
        NgbDropdownModule,
        ValuesPipe,
    ],
    templateUrl: './alarmgroup-element-modal.component.html',
    styleUrl: './alarmgroup-element-modal.component.scss',
})
export class AlarmgroupElementModalComponent
    implements BaseVersionedElementSubmodal<AlarmGroup>
{
    public readonly data = input.required<VersionedElementModalData<any>>();
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

    public readonly availableVehicles = computed(() => {
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
        return this.availableVehicles().find((v) => v.versionId === versionId);
    }

    public submitData() {
        this.dataSubmit.emit(this.values());
    }
}
