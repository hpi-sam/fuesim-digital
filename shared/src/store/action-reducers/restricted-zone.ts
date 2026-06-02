import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ActionReducer } from '../action-reducer.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import { sizeSchema } from '../../models/utils/size.js';
import {
    restrictedZoneSchema,
    type VehicleRestriction,
    vehicleRestrictionSchema,
} from '../../models/restricted-zone.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { type UUID } from '../../utils/uuid.js';
import { mapCoordinatesSchema } from '../../models/utils/position/map-coordinates.js';
import { vehicleTemplateSchema } from '../../models/vehicle-template.js';
import { getElement } from './utils/get-element.js';

const addRestrictedZoneActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Add restricted zone'),
    restrictedZone: restrictedZoneSchema,
});
export type AddRestrictedZoneAction = Immutable<
    z.infer<typeof addRestrictedZoneActionSchema>
>;

const moveRestrictedZoneActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Move restricted zone'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
});
export type MoveRestrictedZoneAction = Immutable<
    z.infer<typeof moveRestrictedZoneActionSchema>
>;

const removeRestrictedZoneActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Remove restricted zone'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
});
export type RemoveRestrictedZoneAction = Immutable<
    z.infer<typeof removeRestrictedZoneActionSchema>
>;

const renameRestrictedZoneActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Rename restricted zone'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    newName: z.string(),
});
export type RenameRestrictedZoneAction = Immutable<
    z.infer<typeof renameRestrictedZoneActionSchema>
>;

const resizeRestrictedZoneActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Resize restricted zone'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    targetPosition: mapCoordinatesSchema,
    newSize: sizeSchema,
});
export type ResizeRestrictedZoneAction = Immutable<
    z.infer<typeof resizeRestrictedZoneActionSchema>
>;

const setRestrictedZoneCapacityActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Set capacity'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    newCapacity: z.number(), // TODO
});
export type SetRestrictedZoneCapacityAction = Immutable<
    z.infer<typeof setRestrictedZoneCapacityActionSchema>
>;

const setRestrictedZoneColorActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Set color'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    newColor: z.string(),
});
export type SetRestrictedZoneColorAction = Immutable<
    z.infer<typeof setRestrictedZoneColorActionSchema>
>;

const setRestrictedZoneNameVisibleActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Set nameVisible'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    newNameVisible: z.boolean(),
});
export type SetRestrictedZoneNameVisibleAction = Immutable<
    z.infer<typeof setRestrictedZoneNameVisibleActionSchema>
>;

const setRestrictedZoneCapacityVisibleActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Set capacityVisible'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    newCapacityVisible: z.boolean(),
});
export type SetRestrictedZoneCapacityVisibleAction = Immutable<
    z.infer<typeof setRestrictedZoneCapacityVisibleActionSchema>
>;

const setVehicleRestrictionActionSchema = z.strictObject({
    type: z.literal('[RestrictedZone] Set vehicle restriction'),
    restrictedZoneId: restrictedZoneSchema.shape.id,
    vehicleTemplateId: vehicleTemplateSchema.shape.id,
    restriction: vehicleRestrictionSchema,
});
export type SetVehicleRestrictionAction = Immutable<
    z.infer<typeof setVehicleRestrictionActionSchema>
>;

export namespace RestrictedZoneActionReducers {
    export const addRestrictedZone: ActionReducer<AddRestrictedZoneAction> = {
        type: addRestrictedZoneActionSchema.shape.type.value,
        actionSchema: addRestrictedZoneActionSchema,
        reducer: (draftState, { restrictedZone }) => {
            // Initialize vehicle restrictions with 'restrict' for all vehicle types
            const vehicleRestrictions: {
                [vehicleTemplateId: UUID]: VehicleRestriction;
            } = {};

            // Get all vehicle types from vehicle templates
            Object.values(draftState.vehicleTemplates).forEach((template) => {
                vehicleRestrictions[template.id] = 'restrict';
            });

            // Get all vehicle types from existing vehicles
            Object.values(draftState.vehicles).forEach((vehicle) => {
                vehicleRestrictions[vehicle.templateId] = 'restrict';
            });

            const newRestrictedZone = cloneDeepMutable(restrictedZone);
            // Restrictions of the template override default restrictions
            newRestrictedZone.vehicleRestrictions = {
                ...vehicleRestrictions,
                ...newRestrictedZone.vehicleRestrictions,
            };

            draftState.restrictedZones[restrictedZone.id] = newRestrictedZone;
            return draftState;
        },
        rights: 'trainer',
    };

    export const moveRestrictedZone: ActionReducer<MoveRestrictedZoneAction> = {
        type: moveRestrictedZoneActionSchema.shape.type.value,
        actionSchema: moveRestrictedZoneActionSchema,
        reducer: (draftState, { restrictedZoneId, targetPosition }) => {
            changePositionWithId(
                restrictedZoneId,
                newMapPositionAt(targetPosition),
                'restrictedZone',
                draftState
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeRestrictedZone: ActionReducer<RemoveRestrictedZoneAction> =
        {
            type: removeRestrictedZoneActionSchema.shape.type.value,
            actionSchema: removeRestrictedZoneActionSchema,
            reducer: (draftState, { restrictedZoneId }) => {
                delete draftState.restrictedZones[restrictedZoneId];
                return draftState;
            },
            rights: 'trainer',
        };

    export const renameRestrictedZone: ActionReducer<RenameRestrictedZoneAction> =
        {
            type: renameRestrictedZoneActionSchema.shape.type.value,
            actionSchema: renameRestrictedZoneActionSchema,
            reducer: (draftState, { restrictedZoneId, newName }) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.name = newName;
                return draftState;
            },
            rights: 'trainer',
        };

    export const resizeRestrictedZone: ActionReducer<ResizeRestrictedZoneAction> =
        {
            type: resizeRestrictedZoneActionSchema.shape.type.value,
            actionSchema: resizeRestrictedZoneActionSchema,
            reducer: (
                draftState,
                { restrictedZoneId, targetPosition, newSize }
            ) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                changePosition(
                    restrictedZone,
                    newMapPositionAt(targetPosition),
                    draftState
                );
                restrictedZone.size = cloneDeepMutable(newSize);
                return draftState;
            },
            rights: 'trainer',
        };

    export const setRestrictedZoneCapacity: ActionReducer<SetRestrictedZoneCapacityAction> =
        {
            type: setRestrictedZoneCapacityActionSchema.shape.type.value,
            actionSchema: setRestrictedZoneCapacityActionSchema,
            reducer: (draftState, { restrictedZoneId, newCapacity }) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.capacity = newCapacity;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setRestrictedZoneColor: ActionReducer<SetRestrictedZoneColorAction> =
        {
            type: setRestrictedZoneColorActionSchema.shape.type.value,
            actionSchema: setRestrictedZoneColorActionSchema,
            reducer: (draftState, { restrictedZoneId, newColor }) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.color = newColor;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setRestrictedZoneNameVisible: ActionReducer<SetRestrictedZoneNameVisibleAction> =
        {
            type: setRestrictedZoneNameVisibleActionSchema.shape.type.value,
            actionSchema: setRestrictedZoneNameVisibleActionSchema,
            reducer: (draftState, { restrictedZoneId, newNameVisible }) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.nameVisible = newNameVisible;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setRestrictedZoneCapacityVisible: ActionReducer<SetRestrictedZoneCapacityVisibleAction> =
        {
            type: setRestrictedZoneCapacityVisibleActionSchema.shape.type.value,
            actionSchema: setRestrictedZoneCapacityVisibleActionSchema,
            reducer: (draftState, { restrictedZoneId, newCapacityVisible }) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.capacityVisible = newCapacityVisible;
                return draftState;
            },
            rights: 'trainer',
        };

    export const setVehicleRestriction: ActionReducer<SetVehicleRestrictionAction> =
        {
            type: setVehicleRestrictionActionSchema.shape.type.value,
            actionSchema: setVehicleRestrictionActionSchema,
            reducer: (
                draftState,
                { restrictedZoneId, vehicleTemplateId, restriction }
            ) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.vehicleRestrictions = {
                    ...restrictedZone.vehicleRestrictions,
                    [vehicleTemplateId]: restriction,
                };
                return draftState;
            },
            rights: 'trainer',
        };
}
