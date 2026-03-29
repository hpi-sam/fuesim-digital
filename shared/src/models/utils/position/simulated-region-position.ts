import * as z from 'zod';
import type { UUID } from '../../../utils/index.js';
import { uuidSchema } from '../../../utils/index.js';

export const simulatedRegionPositionSchema = z.strictObject({
    type: z.literal('simulatedRegion'),
    /**
     * @deprecated Use {@link isInSimulatedRegion } instead
     */
    simulatedRegionId: uuidSchema,
});

export type SimulatedRegionPosition = z.infer<
    typeof simulatedRegionPositionSchema
>;

export function newSimulatedRegionPositionIn(
    simulatedRegionId: UUID
): SimulatedRegionPosition {
    return {
        type: 'simulatedRegion',
        simulatedRegionId,
    };
}
