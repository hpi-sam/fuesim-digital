import { IsBoolean, IsNumber, IsString, IsUUID } from 'class-validator';
import { Action, ActionReducer } from '../action-reducer.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import { IsLiteralUnion } from '../../utils/validators/is-literal-union.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { type Size, sizeSchema } from '../../models/utils/size.js';
import {
    type RestrictedZone,
    restrictedZoneSchema,
    type VehicleRestriction,
    vehicleRestrictionAllowedValues,
} from '../../models/restricted-zone.js';
import { newMapPositionAt } from '../../models/utils/position/map-position.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { IsValue } from '../../utils/validators/is-value.js';
import { type UUID, uuidValidationOptions } from '../../utils/uuid.js';
import {
    type MapCoordinates,
    mapCoordinatesSchema,
} from '../../models/utils/position/map-coordinates.js';
import { getTemplates } from '../../models/template.js';
import { getElement } from './utils/get-element.js';

export class AddRestrictedZoneAction implements Action {
    @IsValue('[RestrictedZone] Add restricted zone' as const)
    public readonly type = '[RestrictedZone] Add restricted zone';
    @IsZodSchema(restrictedZoneSchema)
    public readonly restrictedZone!: RestrictedZone;
}

export class MoveRestrictedZoneAction implements Action {
    @IsValue('[RestrictedZone] Move restricted zone' as const)
    public readonly type = '[RestrictedZone] Move restricted zone';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
}

export class RemoveRestrictedZoneAction implements Action {
    @IsValue('[RestrictedZone] Remove restricted zone' as const)
    public readonly type = '[RestrictedZone] Remove restricted zone';
    @IsUUID()
    public readonly restrictedZoneId!: UUID;
}

export class RenameRestrictedZoneAction implements Action {
    @IsValue('[RestrictedZone] Rename restricted zone' as const)
    public readonly type = '[RestrictedZone] Rename restricted zone';

    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;

    @IsString()
    public readonly newName!: string;
}

export class ResizeRestrictedZoneAction implements Action {
    @IsValue('[RestrictedZone] Resize restricted zone' as const)
    public readonly type = '[RestrictedZone] Resize restricted zone';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsZodSchema(mapCoordinatesSchema)
    public readonly targetPosition!: MapCoordinates;
    @IsZodSchema(sizeSchema)
    public readonly newSize!: Size;
}

export class SetRestrictedZoneCapacityAction implements Action {
    @IsValue('[RestrictedZone] Set capacity' as const)
    public readonly type = '[RestrictedZone] Set capacity';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsNumber()
    public readonly newCapacity!: number;
}

export class SetRestrictedZoneColorAction implements Action {
    @IsValue('[RestrictedZone] Set color' as const)
    public readonly type = '[RestrictedZone] Set color';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsString()
    public readonly newColor!: string;
}

export class SetRestrictedZoneNameVisibleAction implements Action {
    @IsValue('[RestrictedZone] Set nameVisible' as const)
    public readonly type = '[RestrictedZone] Set nameVisible';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsBoolean()
    public readonly newNameVisible!: boolean;
}

export class SetRestrictedZoneCapacityVisibleAction implements Action {
    @IsValue('[RestrictedZone] Set capacityVisible' as const)
    public readonly type = '[RestrictedZone] Set capacityVisible';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsBoolean()
    public readonly newCapacityVisible!: boolean;
}

export class SetVehicleRestrictionAction implements Action {
    @IsValue('[RestrictedZone] Set vehicle restriction' as const)
    public readonly type = '[RestrictedZone] Set vehicle restriction';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsString()
    public readonly vehicleTemplateId!: string;
    @IsLiteralUnion(vehicleRestrictionAllowedValues)
    public readonly restriction!: VehicleRestriction;
}

export namespace RestrictedZoneActionReducers {
    export const addRestrictedZone: ActionReducer<AddRestrictedZoneAction> = {
        action: AddRestrictedZoneAction,
        reducer: (draftState, { restrictedZone }) => {
            // Initialize vehicle restrictions with 'restrict' for all vehicle types
            const vehicleRestrictions: {
                [vehicleTemplateId: UUID]: VehicleRestriction;
            } = {};

            // Get all vehicle types from vehicle templates
            Object.values(getTemplates(draftState, 'vehicleTemplate')).forEach(
                (template) => {
                    vehicleRestrictions[template.id] = 'restrict';
                }
            );

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
        action: MoveRestrictedZoneAction,
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
            action: RemoveRestrictedZoneAction,
            reducer: (draftState, { restrictedZoneId }) => {
                delete draftState.restrictedZones[restrictedZoneId];
                return draftState;
            },
            rights: 'trainer',
        };

    export const renameRestrictedZone: ActionReducer<RenameRestrictedZoneAction> =
        {
            action: RenameRestrictedZoneAction,
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
            action: ResizeRestrictedZoneAction,
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
            action: SetRestrictedZoneCapacityAction,
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
            action: SetRestrictedZoneColorAction,
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
            action: SetRestrictedZoneNameVisibleAction,
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
            action: SetRestrictedZoneCapacityVisibleAction,
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
            action: SetVehicleRestrictionAction,
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
