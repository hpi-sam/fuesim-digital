import { z } from 'zod';
import { patientStatusSchema } from '../utils/patient-status.js';
import type { UUID } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import { transferProgressScopeSchema } from './utils/transfer-progress-scope.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const transferCountsRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('transferCountsRadiogram'),
    transferredPatientsCounts: z.record(
        patientStatusSchema,
        z.int().nonnegative()
    ),
    remainingPatientsCounts: z.record(
        patientStatusSchema,
        z.int().nonnegative()
    ),
    scope: transferProgressScopeSchema,
});
export type TransferCountsRadiogram = z.infer<
    typeof transferCountsRadiogramSchema
>;

export function newTransferCountsRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): TransferCountsRadiogram {
    return {
        id,
        type: 'transferCountsRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        scope: 'singleRegion',
        transferredPatientsCounts: {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        },
        remainingPatientsCounts: {
            red: 0,
            yellow: 0,
            green: 0,
            blue: 0,
            black: 0,
            white: 0,
        },
    };
}
