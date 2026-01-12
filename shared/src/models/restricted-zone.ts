import * as z from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuid } from '../utils/index.js';
import type { ImageProperties, MapCoordinates, Size } from './utils/index.js';
import {
    lowerRightCornerOf,
    upperLeftCornerOf,
    newMapPositionAt,
    positionSchema,
} from './utils/index.js';
import { sizeSchema } from './utils/size.js';

export const vehicleRestrictionTypeSchema = z.literal([
    'ignore',
    'prohibit',
    'restrict',
]);

export type VehicleRestrictionType = z.infer<
    typeof vehicleRestrictionTypeSchema
>;

export const vehicleRestrictionsSchema = z.record(
    z.uuidv4(),
    vehicleRestrictionTypeSchema
);

export type VehicleRestrictions = z.infer<typeof vehicleRestrictionsSchema>;

export const restrictedZoneSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('restrictedZone'),
    position: positionSchema,
    size: sizeSchema,
    name: z.string(),
    capacity: z.int().nonnegative(),
    color: z.string(),
    vehicleIds: z.uuidv4().array(),
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
    vehicleRestrictions?: {
        readonly [vehicleType: string]: VehicleRestrictionType;
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
        vehicleIds: [],
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
    const upperLeftCorner = upperLeftCornerOf(restrictedZone);
    const lowerRightCorner = lowerRightCornerOf(restrictedZone);
    return (
        upperLeftCorner.x <= coordinates.x &&
        coordinates.x <= lowerRightCorner.x &&
        lowerRightCorner.y <= coordinates.y &&
        coordinates.y <= upperLeftCorner.y
    );
}

/**
 * Get the restriction status of a vehicle type in a specific restricted zone
 * @param restrictedZone The restricted zone to get the restriction status of
 * @param vehicleType The UUID of the vehicle type to get the restriction status of
 * @returns The {@link VehicleRestrictionType} of the vehicle type in the restricted zone
 */
export function getVehicleRestriction(
    restrictedZone: RestrictedZone,
    vehicleType: UUID
): VehicleRestrictionType {
    return restrictedZone.vehicleRestrictions[vehicleType] ?? 'ignore';
}

/**
 * Checks whether the given vehicle type is prohibited in a specific restricted zone
 * @param restrictedZone The restricted zone to check against
 * @param vehicleType The UUID of the vehicle type to check
 * @returns `true`, if the vehicle type is prohibited in the zone, `false` otherwise
 */
export function isVehicleProhibited(
    restrictedZone: RestrictedZone,
    vehicleType: UUID
): boolean {
    return getVehicleRestriction(restrictedZone, vehicleType) === 'prohibit';
}

/**
 * Checks whether the given vehicle type is restricted (limited capacity) in a specific restricted zone
 * @param restrictedZone The restricted zone to check against
 * @param vehicleType The UUID of the vehicle type to check
 * @returns `true`, if the vehicle type is restricted in the zone, `false` otherwise
 */
export function isVehicleRestricted(
    restrictedZone: RestrictedZone,
    vehicleType: string
): boolean {
    return getVehicleRestriction(restrictedZone, vehicleType) === 'restrict';
}
