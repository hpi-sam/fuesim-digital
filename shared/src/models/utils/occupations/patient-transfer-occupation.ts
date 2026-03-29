import * as z from 'zod';
import type { UUID } from '../../../utils/index.js';
import { uuidSchema } from '../../../utils/index.js';

export const patientTransferOccupation = z.strictObject({
    type: z.literal('patientTransferOccupation'),
    transportManagementRegionId: uuidSchema,
});

export type PatientTransferOccupation = z.infer<
    typeof patientTransferOccupation
>;

export function newPatientTransferOccupation(
    transportManagementRegionId: UUID
): PatientTransferOccupation {
    return {
        type: 'patientTransferOccupation',
        transportManagementRegionId,
    };
}
