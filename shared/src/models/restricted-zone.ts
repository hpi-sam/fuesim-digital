import { Type } from 'class-transformer';
import {
    IsArray,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from 'class-validator';
import type { UUID } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import { IsValue } from '../utils/validators/index.js';
import {
    type Position,
    getCreate,
    type ImageProperties,
    lowerRightCornerOf,
    upperLeftCornerOf,
    newMapPositionAt,
    IsPosition,
} from './utils/index.js';
import { MapCoordinates, Size } from './utils/index.js';

export type VehicleRestrictionType = 'ignore' | 'prohibit' | 'restrict';

export class RestrictedZone {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('restrictedZone' as const)
    public readonly type = 'restrictedZone';
    /**
     * top-left position
     *
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @IsPosition()
    public readonly position: Position;

    @ValidateNested()
    @Type(() => Size)
    public readonly size: Size;

    @IsString()
    public readonly name: string;

    @IsNumber()
    public readonly capacity: number = 5;

    @IsString()
    public readonly color: string = '#ff4444';

    @IsArray()
    @ValidateNested()
    @IsUUID(4, { ...uuidValidationOptions, each: true })
    public readonly vehicleIds: readonly UUID[] = [];

    @IsOptional()
    @IsObject()
    public readonly vehicleRestrictions: {
        readonly [vehicleType: string]: VehicleRestrictionType;
    } = {};

    constructor(
        position: MapCoordinates,
        size: Size,
        name: string,
        color?: string,
        capacity?: number,
        vehicleRestrictions?: {
            readonly [vehicleType: string]: VehicleRestrictionType;
        }
    ) {
        this.position = newMapPositionAt(position);
        this.size = size;
        this.name = name;
        this.color = color ?? '#ff4444';
        this.capacity = capacity ?? 5;
        this.vehicleRestrictions = vehicleRestrictions ?? {};
    }

    static readonly create = getCreate(this);

    static image: ImageProperties = {
        url: 'assets/restricted-zone.svg',
        height: 1800,
        aspectRatio: 1600 / 900,
    };

    static isInRestrictedZone(
        restrictedZone: RestrictedZone,
        position: MapCoordinates
    ): boolean {
        const upperLeftCorner = upperLeftCornerOf(restrictedZone);
        const lowerRightCorner = lowerRightCornerOf(restrictedZone);
        return (
            upperLeftCorner.x <= position.x &&
            position.x <= lowerRightCorner.x &&
            lowerRightCorner.y <= position.y &&
            position.y <= upperLeftCorner.y
        );
    }

    /**
     * Checks if a specific vehicle type is restricted in this zone
     */
    static getVehicleRestriction(
        restrictedZone: RestrictedZone,
        vehicleType: string
    ): VehicleRestrictionType {
        return restrictedZone.vehicleRestrictions[vehicleType] ?? 'ignore';
    }

    /**
     * Checks if a vehicle type is prohibited in this zone
     */
    static isVehicleProhibited(
        restrictedZone: RestrictedZone,
        vehicleType: string
    ): boolean {
        return (
            this.getVehicleRestriction(restrictedZone, vehicleType) ===
            'prohibit'
        );
    }

    /**
     * Checks if a vehicle type is restricted (limited capacity) in this zone
     */
    static isVehicleRestricted(
        restrictedZone: RestrictedZone,
        vehicleType: string
    ): boolean {
        return (
            this.getVehicleRestriction(restrictedZone, vehicleType) ===
            'restrict'
        );
    }
}
