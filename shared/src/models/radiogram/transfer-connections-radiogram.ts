import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/index.js';

export const transferConnectionsRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('transferConnectionsRadiogram'),
    connectedRegions: z.record(uuidSchema, z.number()),
});
export type TransferConnectionsRadiogram = z.infer<
    typeof transferConnectionsRadiogramSchema
>;

export function newTransferConnectionsRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): TransferConnectionsRadiogram {
    return {
        id,
        type: 'transferConnectionsRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        connectedRegions: {},
    };
}
