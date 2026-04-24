import { z } from 'zod';
import { canCaterForSchema } from '../utils/cater-for.js';
import type { UUID } from '../../utils/uuid.js';
import { radiogramSchema } from './radiogram.js';
import type { ExerciseRadiogramStatus } from './status/exercise-radiogram-status.js';

export const materialCountRadiogramSchema = z.strictObject({
    ...radiogramSchema.shape,
    type: z.literal('materialCountRadiogram'),
    materialForPatients: canCaterForSchema,
});
export type MaterialCountRadiogram = z.infer<
    typeof materialCountRadiogramSchema
>;

export function newMaterialCountRadiogram(
    id: UUID,
    simulatedRegionId: UUID,
    informationRequestKey: string | null,
    status: ExerciseRadiogramStatus
): MaterialCountRadiogram {
    return {
        id,
        type: 'materialCountRadiogram',
        simulatedRegionId,
        informationRequestKey,
        status,
        informationAvailable: false,
        materialForPatients: {
            red: 0,
            yellow: 0,
            green: 0,
            logicalOperator: 'and',
        },
    };
}
