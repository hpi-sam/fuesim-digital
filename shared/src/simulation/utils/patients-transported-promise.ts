import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';

export const patientsTransportPromiseSchema = z.strictObject({
    type: z.literal('patientsTransportPromise'),
    promisedTime: z.int().nonnegative(),
    patientCount: z.int().nonnegative(),
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
