import { z } from 'zod';
import { uuid, uuidSetSchema } from '../utils/index.js';
import { isInSimulatedRegion, positionSchema } from './utils/index.js';
import type { ImageProperties, Position } from './utils/index.js';

export const reachableTransferPointsSchema = z.record(
    z.uuidv4(),
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
    id: z.uuidv4(),
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
