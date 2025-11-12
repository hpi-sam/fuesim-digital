import { Type } from 'class-transformer';
import {
    IsString,
    ValidateNested,
    IsUUID,
    IsInt,
    IsArray,
} from 'class-validator';
import { VehicleTemplate } from '../../models/index.js';
import { ImageProperties } from '../../models/utils/index.js';
import type { ExerciseState } from '../../state.js';
import type { Mutable, UUID } from '../../utils/index.js';
import { uuidValidationOptions, cloneDeepMutable } from '../../utils/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsValue } from '../../utils/validators/is-value.js';

export class AddVehicleTemplateAction implements Action {
    @IsValue('[VehicleTemplate] Add vehicleTemplate')
    public readonly type = '[VehicleTemplate] Add vehicleTemplate';

    @ValidateNested()
    @Type(() => VehicleTemplate)
    public readonly vehicleTemplate!: VehicleTemplate;
}

export class EditVehicleTemplateAction implements Action {
    @IsValue('[VehicleTemplate] Edit vehicleTemplate')
    public readonly type = '[VehicleTemplate] Edit vehicleTemplate';

    @IsUUID(4, uuidValidationOptions)
    public readonly id!: UUID;

    @IsString()
    public readonly name!: string;

    @IsString()
    public readonly vehicleType!: string;

    @IsInt()
    public readonly patientCapacity!: number;

    @ValidateNested()
    @Type(() => ImageProperties)
    public readonly image!: ImageProperties;

    @IsUUID(4, { each: true })
    @IsArray()
    public readonly materialTemplateIds!: readonly UUID[];

    @IsUUID(4, { each: true })
    @IsArray()
    public readonly personnelTemplateIds!: readonly UUID[];
}

export class DeleteVehicleTemplateAction implements Action {
    @IsValue('[VehicleTemplate] Delete vehicleTemplate')
    public readonly type = '[VehicleTemplate] Delete vehicleTemplate';

    @IsUUID(4, uuidValidationOptions)
    public readonly id!: UUID;
}

export namespace VehicleTemplateActionReducers {
    export const addVehicleTemplate: ActionReducer<AddVehicleTemplateAction> = {
        action: AddVehicleTemplateAction,
        reducer: (draftState, { vehicleTemplate }) => {
            if (
                draftState.vehicleTemplates.some(
                    (template) => template.id === vehicleTemplate.id
                )
            ) {
                throw new ReducerError(
                    `VehicleTemplate with id ${vehicleTemplate.id} already exists`
                );
            }
            draftState.vehicleTemplates.push(cloneDeepMutable(vehicleTemplate));
            return draftState;
        },
        rights: 'trainer',
    };

    export const editVehicleTemplate: ActionReducer<EditVehicleTemplateAction> =
        {
            action: EditVehicleTemplateAction,
            reducer: (
                draftState,
                {
                    id,
                    name,
                    vehicleType,
                    image,
                    patientCapacity,
                    materialTemplateIds,
                    personnelTemplateIds,
                }
            ) => {
                const vehicleTemplate = getVehicleTemplate(draftState, id);
                vehicleTemplate.image = cloneDeepMutable(image);
                vehicleTemplate.name = name;
                vehicleTemplate.patientCapacity = patientCapacity;
                vehicleTemplate.vehicleType = vehicleType;
                vehicleTemplate.materialTemplateIds =
                    cloneDeepMutable(materialTemplateIds);
                vehicleTemplate.personnelTemplateIds =
                    cloneDeepMutable(personnelTemplateIds);

                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteVehicleTemplate: ActionReducer<DeleteVehicleTemplateAction> =
        {
            action: DeleteVehicleTemplateAction,
            reducer: (draftState, { id }) => {
                getVehicleTemplate(draftState, id);
                draftState.vehicleTemplates =
                    draftState.vehicleTemplates.filter(
                        (template) => template.id !== id
                    );
                // Delete this template from every alarm group
                for (const alarmGroup of Object.values(
                    draftState.alarmGroups
                )) {
                    alarmGroup.alarmGroupVehicles = Object.fromEntries(
                        Object.entries(alarmGroup.alarmGroupVehicles).filter(
                            ([_, vehicle]) => vehicle.vehicleTemplateId !== id
                        )
                    );
                }
                return draftState;
            },
            rights: 'trainer',
        };
}

function getVehicleTemplate(
    state: Mutable<ExerciseState>,
    id: UUID
): Mutable<VehicleTemplate> {
    const vehicleTemplate = state.vehicleTemplates.find(
        (template) => template.id === id
    );
    if (!vehicleTemplate) {
        throw new ReducerError(`VehicleTemplate with id ${id} does not exist`);
    }
    return vehicleTemplate;
}
