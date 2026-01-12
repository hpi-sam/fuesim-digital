import { IsNumber, IsString, IsUUID } from 'class-validator';
import { Action, ActionReducer } from '../action-reducer.js';
import { IsValue } from '../../utils/validators/index.js';
import {
    coordinatesOfPosition,
    type RestrictedZone,
    type MapCoordinates,
    type Size,
    type VehicleRestrictionType,
    newMapPositionAt,
    mapCoordinatesSchema,
} from '../../models/index.js';
import type { Mutable, UUID } from '../../utils/index.js';
import { cloneDeepMutable, uuidValidationOptions } from '../../utils/index.js';
import {
    changePosition,
    changePositionWithId,
} from '../../models/utils/position/position-helpers-mutable.js';
import { ExerciseState } from '../../state.js';
import { IsLiteralUnion } from '../../utils/validators/is-literal-union.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import { sizeSchema } from '../../models/utils/size.js';
import {
    isInRestrictedZone,
    restrictedZoneSchema,
} from '../../models/restricted-zone.js';
import { getElement } from './utils/index.js';

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

export class SetVehicleRestrictionAction implements Action {
    @IsValue('[RestrictedZone] Set vehicle restriction' as const)
    public readonly type = '[RestrictedZone] Set vehicle restriction';
    @IsUUID(4, uuidValidationOptions)
    public readonly restrictedZoneId!: UUID;
    @IsString()
    public readonly vehicleType!: string;
    @IsLiteralUnion({
        ignore: true,
        restrict: true,
        prohibit: true,
    })
    public readonly restriction!: VehicleRestrictionType;
}

function recheckVehiclesInZone(
    draftState: Mutable<ExerciseState>,
    restrictedZone: RestrictedZone
) {
    restrictedZone.vehicleIds
        .filter((vehicleId) => {
            const vehicle = getElement(draftState, 'vehicle', vehicleId);
            return !isInRestrictedZone(
                restrictedZone,
                coordinatesOfPosition(vehicle.position)
            );
        })
        .forEach((vehicleId) => {
            const vehicle = getElement(draftState, 'vehicle', vehicleId);
            vehicle.restrictedZoneId = undefined;
        });
    return restrictedZone.vehicleIds.filter((vehicleId) => {
        const vehicle = getElement(draftState, 'vehicle', vehicleId);
        return isInRestrictedZone(
            restrictedZone,
            coordinatesOfPosition(vehicle.position)
        );
    });
}

export namespace RestrictedZoneActionReducers {
    export const addRestrictedZone: ActionReducer<AddRestrictedZoneAction> = {
        action: AddRestrictedZoneAction,
        reducer: (draftState, { restrictedZone }) => {
            // Initialize vehicle restrictions with 'restrict' for all vehicle types
            const vehicleRestrictions: {
                [vehicleType: string]: VehicleRestrictionType;
            } = {};

            // Get all vehicle types from vehicle templates
            Object.values(draftState.vehicleTemplates).forEach((template) => {
                vehicleRestrictions[template.vehicleType] = 'restrict';
            });

            // Get all vehicle types from existing vehicles
            Object.values(draftState.vehicles).forEach((vehicle) => {
                vehicleRestrictions[vehicle.vehicleType] = 'restrict';
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
            const restrictedZone = getElement(
                draftState,
                'restrictedZone',
                restrictedZoneId
            );
            restrictedZone.vehicleIds = recheckVehiclesInZone(
                draftState,
                restrictedZone
            );
            return draftState;
        },
        rights: 'trainer',
    };

    export const removeRestrictedZone: ActionReducer<RemoveRestrictedZoneAction> =
        {
            action: RemoveRestrictedZoneAction,
            reducer: (draftState, { restrictedZoneId }) => {
                Object.values(draftState.vehicles).forEach((vehicle) => {
                    if (vehicle.restrictedZoneId === restrictedZoneId) {
                        vehicle.restrictedZoneId = undefined;
                    }
                });
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
                restrictedZone.vehicleIds = recheckVehiclesInZone(
                    draftState,
                    restrictedZone
                );
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

    export const setVehicleRestriction: ActionReducer<SetVehicleRestrictionAction> =
        {
            action: SetVehicleRestrictionAction,
            reducer: (
                draftState,
                { restrictedZoneId, vehicleType, restriction }
            ) => {
                const restrictedZone = getElement(
                    draftState,
                    'restrictedZone',
                    restrictedZoneId
                );
                restrictedZone.vehicleRestrictions = {
                    ...restrictedZone.vehicleRestrictions,
                    [vehicleType]: restriction,
                };
                return draftState;
            },
            rights: 'trainer',
        };
}
