import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const missingTransferConnectionRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('missingTransferConnectionRadiogram'),
    targetTransferPointId: uuidSchema,
});
export type MissingTransferConnectionRadiogram = z.infer<
    typeof missingTransferConnectionRadiogramSchema
>;

export function newMissingTransferConnectionRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    status: ExerciseRadiogramStatus,
    targetTransferPointId: UUID
): MissingTransferConnectionRadiogram {
    return {
        id,
        type: 'missingTransferConnectionRadiogram',
        simulatedRegionId,
        status,
        targetTransferPointId,
        informationAvailable: true,
        informationRequestKey: null,
    };
}
