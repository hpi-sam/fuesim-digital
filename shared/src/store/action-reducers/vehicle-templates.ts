import { IsString, IsUUID, IsInt, IsArray } from 'class-validator';
import { WritableDraft } from 'immer';
import {
    type VehicleTemplate,
    imagePropertiesSchema,
    type ImageProperties,
} from '../../models/index.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    uuidArrayValidationOptions,
    uuidValidationOptions,
    cloneDeepMutable,
} from '../../utils/index.js';
import { vehicleTemplateSchema } from '../../models/vehicle-template.js';

export class AddVehicleTemplateAction implements Action {
    @IsValue('[VehicleTemplate] Add vehicleTemplate')
    public readonly type = '[VehicleTemplate] Add vehicleTemplate';

    @IsZodSchema(vehicleTemplateSchema)
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

    @IsZodSchema(imagePropertiesSchema)
    public readonly image!: ImageProperties;

    @IsUUID(4, uuidArrayValidationOptions)
    @IsArray()
    public readonly materialTemplateIds!: readonly UUID[];

    @IsUUID(4, uuidArrayValidationOptions)
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
            if (draftState.vehicleTemplates[vehicleTemplate.id]) {
                throw new ReducerError(
                    `VehicleTemplate with id ${vehicleTemplate.id} already exists`
                );
            }
            draftState.vehicleTemplates[vehicleTemplate.id] =
                cloneDeepMutable(vehicleTemplate);
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
                delete draftState.vehicleTemplates[id];
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
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<VehicleTemplate> {
    const vehicleTemplate = state.vehicleTemplates[id];
    if (!vehicleTemplate) {
        throw new ReducerError(`VehicleTemplate with id ${id} does not exist`);
    }
    return vehicleTemplate;
}
