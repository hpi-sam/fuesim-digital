import type { WritableDraft, Immutable } from 'immer';
import { z } from 'zod';
import type { ExerciseState } from '../../state.js';
import type { ActionReducer } from '../action-reducer.js';
import { ReducerError } from '../reducer-error.js';
import {
    type VehicleTemplate,
    vehicleTemplateSchema,
} from '../../models/vehicle-template.js';
import { type UUID } from '../../utils/uuid.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';

const addVehicleTemplateActionSchema = z.strictObject({
    type: z.literal('[VehicleTemplate] Add vehicleTemplate'),
    vehicleTemplate: vehicleTemplateSchema,
});
export type AddVehicleTemplateAction = Immutable<
    z.infer<typeof addVehicleTemplateActionSchema>
>;

const editVehicleTemplateActionSchema = z.strictObject({
    type: z.literal('[VehicleTemplate] Edit vehicleTemplate'),
    id: vehicleTemplateSchema.shape.id,
    name: vehicleTemplateSchema.shape.name,
    vehicleType: vehicleTemplateSchema.shape.vehicleType,
    patientCapacity: vehicleTemplateSchema.shape.patientCapacity,
    patientLoadMinutes: vehicleTemplateSchema.shape.patientLoadMinutes,
    image: vehicleTemplateSchema.shape.image,
    materialTemplateIds: vehicleTemplateSchema.shape.materialTemplateIds,
    personnelTemplateIds: vehicleTemplateSchema.shape.personnelTemplateIds,
});
export type EditVehicleTemplateAction = Immutable<
    z.infer<typeof editVehicleTemplateActionSchema>
>;

const deleteVehicleTemplateActionSchema = z.strictObject({
    type: z.literal('[VehicleTemplate] Delete vehicleTemplate'),
    id: vehicleTemplateSchema.shape.id,
});
export type DeleteVehicleTemplateAction = Immutable<
    z.infer<typeof deleteVehicleTemplateActionSchema>
>;

export namespace VehicleTemplateActionReducers {
    export const addVehicleTemplate: ActionReducer<AddVehicleTemplateAction> = {
        type: addVehicleTemplateActionSchema.shape.type.value,
        actionSchema: addVehicleTemplateActionSchema,
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
            type: editVehicleTemplateActionSchema.shape.type.value,
            actionSchema: editVehicleTemplateActionSchema,
            reducer: (
                draftState,
                {
                    id,
                    name,
                    vehicleType,
                    image,
                    patientCapacity,
                    patientLoadMinutes,
                    materialTemplateIds,
                    personnelTemplateIds,
                }
            ) => {
                const vehicleTemplate = getVehicleTemplate(draftState, id);
                vehicleTemplate.image = cloneDeepMutable(image);
                vehicleTemplate.name = name;
                vehicleTemplate.patientCapacity = patientCapacity;
                vehicleTemplate.patientLoadMinutes = patientLoadMinutes;
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
            type: deleteVehicleTemplateActionSchema.shape.type.value,
            actionSchema: deleteVehicleTemplateActionSchema,
            reducer: (draftState, { id }) => {
                getVehicleTemplate(draftState, id);
                delete draftState.vehicleTemplates[id];

                delete draftState.vehicleCounters[id];

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
