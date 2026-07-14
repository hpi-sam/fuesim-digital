import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const transferConnectionsRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('transferConnectionsRadiogram'),
    connectedRegions: z.record(uuidSchema, z.number()),
});
export type TransferConnectionsRadiogram = Immutable<
    z.infer<typeof transferConnectionsRadiogramSchema>
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
