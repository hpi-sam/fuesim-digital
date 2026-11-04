import { castDraft, type Immutable, type WritableDraft } from 'immer';
import { z } from 'zod';
import {
    type MapImageTemplate,
    mapImageTemplateSchema,
} from '../../models/map-image-template.js';
import type { ActionReducer } from '../action-reducer.js';
import { getTemplates } from '../../models/template.js';
import { ReducerError } from '../reducer-error.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import type { ExerciseState } from '../../state.js';
import type { UUID } from '../../utils/uuid.js';
import type { ParticipantKey } from '../../exercise-keys.js';
import {
    type VehicleTemplate,
    vehicleTemplateSchema,
} from '../../models/vehicle-template.js';

/** @deprecated */
export const setParticipantIdActionSchema = z.strictObject({
    type: z.literal('[Exercise] Set Participant Id'),
    participantId: z.string(),
});
/** @deprecated */
export type SetParticipantIdAction = Immutable<
    z.infer<typeof setParticipantIdActionSchema>
>;

/** @deprecated */
const addVehicleTemplateActionSchema = z.strictObject({
    type: z.literal('[VehicleTemplate] Add vehicleTemplate'),
    vehicleTemplate: vehicleTemplateSchema,
});
/** @deprecated */
export type AddVehicleTemplateAction = Immutable<
    z.infer<typeof addVehicleTemplateActionSchema>
>;

/** @deprecated */
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
/** @deprecated */
export type EditVehicleTemplateAction = Immutable<
    z.infer<typeof editVehicleTemplateActionSchema>
>;

/** @deprecated */
const deleteVehicleTemplateActionSchema = z.strictObject({
    type: z.literal('[VehicleTemplate] Delete vehicleTemplate'),
    id: vehicleTemplateSchema.shape.id,
});
/** @deprecated */
export type DeleteVehicleTemplateAction = Immutable<
    z.infer<typeof deleteVehicleTemplateActionSchema>
>;

/** @deprecated */
export const addMapImageTemplateActionSchema = z.strictObject({
    type: z.literal('[MapImageTemplate] Add mapImageTemplate'),
    mapImageTemplate: mapImageTemplateSchema,
});
/** @deprecated */
export type AddMapImageTemplateAction = Immutable<
    z.infer<typeof addMapImageTemplateActionSchema>
>;

/** @deprecated */
export const editMapImageTemplateActionSchema = z.strictObject({
    type: z.literal('[MapImageTemplate] Edit mapImageTemplate'),
    id: mapImageTemplateSchema.shape.id,
    name: mapImageTemplateSchema.shape.name,
    image: mapImageTemplateSchema.shape.image,
});
/** @deprecated */
export type EditMapImageTemplateAction = Immutable<
    z.infer<typeof editMapImageTemplateActionSchema>
>;

/** @deprecated */
export const deleteMapImageTemplateActionSchema = z.strictObject({
    type: z.literal('[MapImageTemplate] Delete mapImageTemplate'),
    id: mapImageTemplateSchema.shape.id,
});
/** @deprecated */
export type DeleteMapImageTemplateAction = Immutable<
    z.infer<typeof deleteMapImageTemplateActionSchema>
>;

function getVehicleTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<VehicleTemplate> {
    const vehicleTemplate = getTemplates(state, 'vehicleTemplate')[id];
    if (!vehicleTemplate) {
        throw new ReducerError(`VehicleTemplate with id ${id} does not exist`);
    }
    return castDraft(vehicleTemplate);
}

function getMapImageTemplate(
    state: WritableDraft<ExerciseState>,
    id: UUID
): WritableDraft<MapImageTemplate> {
    const mapImageTemplate = getTemplates(state, 'mapImageTemplate')[id];
    if (!mapImageTemplate) {
        throw new ReducerError(`MapImageTemplate with id ${id} does not exist`);
    }
    return mapImageTemplate;
}

/**
 * @deprecated Those are deprecated action reducers and are only kept for backwards-compatibilty of action histories.
 */
export namespace DeprecatedActionReducers {
    export const setParticipantId: ActionReducer<SetParticipantIdAction> = {
        type: '[Exercise] Set Participant Id',
        actionSchema: setParticipantIdActionSchema,
        reducer: (draftState, { participantId }) => {
            draftState.participantKey = participantId as ParticipantKey;
            return draftState;
        },
        rights: 'server',
    };

    export const addVehicleTemplate: ActionReducer<AddVehicleTemplateAction> = {
        type: addVehicleTemplateActionSchema.shape.type.value,
        actionSchema: addVehicleTemplateActionSchema,
        reducer: (draftState, { vehicleTemplate }) => {
            if (draftState.templates[vehicleTemplate.id]) {
                throw new ReducerError(
                    `Template with id ${vehicleTemplate.id} already exists`
                );
            }
            draftState.templates[vehicleTemplate.id] =
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

    /**
     * @deprecated This becomes obsolete with the Marketplace
     */
    export const deleteVehicleTemplate: ActionReducer<DeleteVehicleTemplateAction> =
        {
            type: deleteVehicleTemplateActionSchema.shape.type.value,
            actionSchema: deleteVehicleTemplateActionSchema,
            reducer: (draftState, { id }) => {
                getVehicleTemplate(draftState, id);
                delete draftState.templates[id];

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

    export const addMapImageTemplate: ActionReducer<AddMapImageTemplateAction> =
        {
            type: addMapImageTemplateActionSchema.shape.type.value,
            actionSchema: addMapImageTemplateActionSchema,
            reducer: (draftState, { mapImageTemplate }) => {
                if (
                    getTemplates(draftState, 'mapImageTemplate')[
                        mapImageTemplate.id
                    ]
                ) {
                    throw new ReducerError(
                        `MapImageTemplate with id ${mapImageTemplate.id} already exists`
                    );
                }
                draftState.templates[mapImageTemplate.id] =
                    cloneDeepMutable(mapImageTemplate);
                return draftState;
            },
            rights: 'trainer',
        };

    export const editMapImageTemplate: ActionReducer<EditMapImageTemplateAction> =
        {
            type: editMapImageTemplateActionSchema.shape.type.value,
            actionSchema: editMapImageTemplateActionSchema,
            reducer: (draftState, { id, name, image }) => {
                const mapImageTemplate = getMapImageTemplate(draftState, id);
                mapImageTemplate.name = name;
                mapImageTemplate.image = cloneDeepMutable(image);
                return draftState;
            },
            rights: 'trainer',
        };

    export const deleteMapImageTemplate: ActionReducer<DeleteMapImageTemplateAction> =
        {
            type: deleteMapImageTemplateActionSchema.shape.type.value,
            actionSchema: deleteMapImageTemplateActionSchema,
            reducer: (draftState, { id }) => {
                getMapImageTemplate(draftState, id);
                delete draftState.templates[id];
                return draftState;
            },
            rights: 'trainer',
        };
}
