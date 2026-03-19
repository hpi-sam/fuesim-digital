import { z } from 'zod';
import { treatmentProgressSchema } from '../../simulation/utils/treatment.js';
import type { UUID } from '../../utils/index.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/index.js';

export const treatmentStatusRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('treatmentStatusRadiogram'),
    treatmentStatus: treatmentProgressSchema,
    treatmentStatusChanged: z.boolean(),
});
export type TreatmentStatusRadiogram = z.infer<
    typeof treatmentStatusRadiogramSchema
>;

export function newTreatmentStatusRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): TreatmentStatusRadiogram {
    return {
        id,
        type: 'treatmentStatusRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        treatmentStatus: 'noTreatment',
        treatmentStatusChanged: false,
    };
}
