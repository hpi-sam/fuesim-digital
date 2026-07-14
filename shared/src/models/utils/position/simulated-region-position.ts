import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../../utils/uuid.js';

export const simulatedRegionPositionSchema = z.strictObject({
    type: z.literal('simulatedRegion'),
    /**
     * @deprecated Use {@link isInSimulatedRegion } instead
     */
    simulatedRegionId: uuidSchema,
});

export type SimulatedRegionPosition = Immutable<
    z.infer<typeof simulatedRegionPositionSchema>
>;

export function newSimulatedRegionPositionIn(
    simulatedRegionId: UUID
): SimulatedRegionPosition {
    return {
        type: 'simulatedRegion',
        simulatedRegionId,
    };
}
