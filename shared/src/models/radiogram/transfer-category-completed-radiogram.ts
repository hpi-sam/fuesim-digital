import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { patientStatusSchema } from '../utils/index.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/index.js';
import { transferProgressScopeSchema } from './utils/transfer-progress-scope.js';

export const transferCategoryCompletedRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('transferCategoryCompletedRadiogram'),
    completedCategory: patientStatusSchema,
    scope: transferProgressScopeSchema,
});

export type TransferCategoryCompletedRadiogram = z.infer<
    typeof transferCategoryCompletedRadiogramSchema
>;
export function newTransferCategoryCompletedRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    status: ExerciseRadiogramStatus
): TransferCategoryCompletedRadiogram {
    return {
        id,
        type: 'transferCategoryCompletedRadiogram',
        simulatedRegionId,
        status,
        informationAvailable: false,
        informationRequestKey: null,
        completedCategory: 'white',
        scope: 'singleRegion',
    };
}
