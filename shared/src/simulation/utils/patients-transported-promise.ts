import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';

export const patientsTransportPromiseSchema = z.strictObject({
    type: z.literal('patientsTransportPromise'),
    promisedTime: z.number().int().nonnegative(),
    patientCount: z.number().int().nonnegative(),
    targetSimulatedRegionId: uuidSchema,
});

export type PatientsTransportPromise = z.infer<
    typeof patientsTransportPromiseSchema
>;

export function newPatientsTransportPromise(
    promisedTime: number,
    patientCount: number,
    targetSimulatedRegionId: UUID
): PatientsTransportPromise {
    return {
        type: 'patientsTransportPromise',
        promisedTime,
        patientCount,
        targetSimulatedRegionId,
    };
}
