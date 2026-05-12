import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../../utils/uuid.js';

export const patientTransferOccupation = z.strictObject({
    type: z.literal('patientTransferOccupation'),
    transportManagementRegionId: uuidSchema,
});

export type PatientTransferOccupation = Immutable<
    z.infer<typeof patientTransferOccupation>
>;

export function newPatientTransferOccupation(
    transportManagementRegionId: UUID
): PatientTransferOccupation {
    return {
        type: 'patientTransferOccupation',
        transportManagementRegionId,
    };
}
