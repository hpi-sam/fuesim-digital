import { z } from 'zod';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { uuidSetSchema } from '../utils/uuid-set.js';
import { type Position, positionSchema } from './utils/position/position.js';
import type { ImageProperties } from './utils/image-properties.js';
import { isInSimulatedRegion } from './utils/position/position-helpers.js';

export const reachableTransferPointsSchema = z.record(
    uuidSchema,
    z.object({
        /**
         * The time in ms it takes to get from this transfer point to the other one.
         */
        duration: z.number().nonnegative(),
    })
);
export type ReachableTransferPoints = z.infer<
    typeof reachableTransferPointsSchema
>;

export const transferPointSchema = z.strictObject({
    id: uuidSchema,
    type: z.literal('transferPoint'),
    position: positionSchema,
    reachableTransferPoints: reachableTransferPointsSchema,
    reachableHospitals: uuidSetSchema,
    internalName: z.string(),
    externalName: z.string(),
});
export type TransferPoint = z.infer<typeof transferPointSchema>;

export const transferPointImage: ImageProperties = {
    url: 'assets/transfer-point.svg',
    height: 400,
    aspectRatio: 134 / 102,
};

export function newTransferPoint(
    position: Position,
    internalName: string,
    externalName: string
): TransferPoint {
    return {
        id: uuid(),
        type: 'transferPoint',
        position,
        reachableTransferPoints: {},
        reachableHospitals: {},
        internalName,
        externalName,
    };
}

export function getTransferPointFullName(transferPoint: TransferPoint): string {
    if (isInSimulatedRegion(transferPoint)) {
        // Transfer points in simulated regions don't have an internal name,
        // and we don't want to show empty parentheses
        return transferPoint.externalName;
    }

    return `${transferPoint.externalName} (${transferPoint.internalName})`;
}
