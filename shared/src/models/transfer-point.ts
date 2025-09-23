import { IsString, IsUUID, ValidateNested } from 'class-validator';
import type { UUID, UUIDSet } from '../utils/index.js';
import { uuid, uuidValidationOptions } from '../utils/index.js';
import {
    IsReachableTransferPoints,
    IsUUIDSet,
    IsValue,
} from '../utils/validators/index.js';
import { IsPosition } from '../utils/validators/is-position.js';
import type { ImageProperties } from './utils/index.js';
import type { Position } from './utils/index.js';
import { getCreate, isInSimulatedRegion } from './utils/index.js';

export class TransferPoint {
    @IsUUID(4, uuidValidationOptions)
    public readonly id: UUID = uuid();

    @IsValue('transferPoint' as const)
    public readonly type = 'transferPoint';

    /**
     * @deprecated Do not access directly, use helper methods from models/utils/position/position-helpers(-mutable) instead.
     */
    @ValidateNested()
    @IsPosition()
    public readonly position: Position;

    @IsReachableTransferPoints()
    public readonly reachableTransferPoints: ReachableTransferPoints;

    @IsUUIDSet()
    public readonly reachableHospitals: UUIDSet = {};

    @IsString()
    public readonly internalName: string;

    @IsString()
    public readonly externalName: string;

    /**
     * @deprecated Use {@link create} instead
     */
    constructor(
        position: Position,
        reachableTransferPoints: ReachableTransferPoints,
        reachableHospitals: UUIDSet,
        internalName: string,
        externalName: string
    ) {
        this.position = position;
        this.reachableTransferPoints = reachableTransferPoints;
        this.reachableHospitals = reachableHospitals;
        this.internalName = internalName;
        this.externalName = externalName;
    }

    static readonly create = getCreate(this);

    static image: ImageProperties = {
        url: 'assets/transfer-point.svg',
        height: 400,
        aspectRatio: 134 / 102,
    };

    public static getFullName(transferPoint: TransferPoint): string {
        if (isInSimulatedRegion(transferPoint)) {
            // Transfer points in simulated regions don't have an internal name and we don't want to show empty parentheses
            return transferPoint.externalName;
        }

        return `${transferPoint.externalName} (${transferPoint.internalName})`;
    }
}

export interface ReachableTransferPoints {
    readonly [connectTransferPointId: UUID]: {
        /**
         * The time in ms it takes to get from this transfer point to the other one.
         */
        readonly duration: number;
    };
}
