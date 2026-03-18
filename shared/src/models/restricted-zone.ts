import * as z from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuid, uuidSchema } from '../utils/index.js';
import type { ExerciseState } from '../state.js';
import type { AllowedValues } from '../utils/validators/index.js';
import type { ImageProperties, MapCoordinates, Size } from './utils/index.js';
import {
    isWithinExtent,
    newMapPositionAt,
    positionSchema,
    isOnMap,
    currentCoordinatesOf,
} from './utils/index.js';
import { sizeSchema } from './utils/size.js';

export const vehicleRestrictionSchema = z.literal([
    'ignore',
    'prohibit',
    'restrict',
]);

export type VehicleRestriction = z.infer<typeof vehicleRestrictionSchema>;

export const vehicleRestrictionAllowedValues: AllowedValues<VehicleRestriction> =
    {
        ignore: true,
        prohibit: true,
        restrict: true,
    };

export const vehicleRestrictionsSchema = z.record(
    uuidSchema,
    vehicleRestrictionSchema
);

export type VehicleRestrictions = z.infer<typeof vehicleRestrictionsSchema>;

export const restrictedZoneSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('restrictedZone'),
    position: positionSchema,
    size: sizeSchema,
    name: z.string(),
    capacity: z.int().nonnegative(),
    color: z.string(),
    nameVisible: z.boolean(),
    capacityVisible: z.boolean(),
    vehicleRestrictions: vehicleRestrictionsSchema,
});

export type RestrictedZone = Immutable<z.infer<typeof restrictedZoneSchema>>;

export const restrictedZoneImage = {
    url: 'assets/restricted-zone.svg',
    height: 1800,
    aspectRatio: 1600 / 900,
} as const satisfies ImageProperties;

export function newRestrictedZone(
    position: MapCoordinates,
    size: Size,
    name: string,
    capacity: number,
    color: string,
    nameVisible: boolean,
    capacityVisible: boolean,
    vehicleRestrictions?: {
        readonly [vehicleType: string]: VehicleRestriction;
    }
): RestrictedZone {
    return {
        id: uuid(),
        type: 'restrictedZone',
        position: newMapPositionAt(position),
        size,
        name,
        capacity,
        color,
        nameVisible,
        capacityVisible,
        vehicleRestrictions: vehicleRestrictions ?? {},
    };
}

/**
 * Checks whether given coordinates are located within a specific restricted zone
 * @param restrictedZone The restricted zone to check against
 * @param coordinates The coordinates to be checked
 * @returns `true`, if the coordinates are located within the zone, `false` otherwise
 */
export function isInRestrictedZone(
    restrictedZone: RestrictedZone,
    coordinates: MapCoordinates
): boolean {
    return isWithinExtent(restrictedZone, coordinates);
}

/**
 * Get the restriction status of a vehicle type in a specific restricted zone
 * @param restrictedZone The restricted zone to get the restriction status of
 * @param vehicleTemplateId The UUID of the vehicle template to get the restriction status of
 * @returns The {@link VehicleRestriction} of the vehicle type in the restricted zone
 */
export function getVehicleTemplateRestriction(
    restrictedZone: RestrictedZone,
    vehicleTemplateId: UUID
): VehicleRestriction {
    return restrictedZone.vehicleRestrictions[vehicleTemplateId] ?? 'restrict';
}

/**
 * Checks whether the given vehicle type is prohibited in a specific restricted zone
 * @param restrictedZone The restricted zone to check against
 * @param vehicleTemplateId The UUID of the vehicle template to check
 * @returns `true`, if the vehicle type is prohibited in the zone, `false` otherwise
 */
export function isVehicleTemplateProhibited(
    restrictedZone: RestrictedZone,
    vehicleTemplateId: UUID
): boolean {
    return (
        getVehicleTemplateRestriction(restrictedZone, vehicleTemplateId) ===
        'prohibit'
    );
}

/**
 * Checks whether the given vehicle type is restricted (limited capacity) in a specific restricted zone
 * @param restrictedZone The restricted zone to check against
 * @param vehicleTemplateId The UUID of the vehicle template to check
 * @returns `true`, if the vehicle type is restricted in the zone, `false` otherwise
 */
export function isVehicleTemplateRestricted(
    restrictedZone: RestrictedZone,
    vehicleTemplateId: UUID
): boolean {
    return (
        getVehicleTemplateRestriction(restrictedZone, vehicleTemplateId) ===
        'restrict'
    );
}

/**
 * Counts how many restricted vehicles are in the given zone
 * @param state The state to count in. Used to get a list of vehicles.
 * @param restrictedZone The restricted zone to count the vehicles in.
 * @param vehicleIdToIgnore The ID of a vehicle that should be ignored while counting (optional).
 * @returns The number of vehicles, whose template is restricted, in the zone.
 */
export function countRestrictedVehiclesInRestrictedZone(
    state: ExerciseState,
    restrictedZone: RestrictedZone,
    vehicleIdToIgnore?: UUID
) {
    return Object.values(state.vehicles).filter(
        (v) =>
            v.id !== vehicleIdToIgnore &&
            isOnMap(v) &&
            isInRestrictedZone(restrictedZone, currentCoordinatesOf(v)) &&
            isVehicleTemplateRestricted(restrictedZone, v.templateId)
    ).length;
}
