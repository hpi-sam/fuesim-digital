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

export const newPatientTransferOccupation = (
    transportManagementRegionId: UUID
): PatientTransferOccupation => ({
    type: 'patientTransferOccupation',
    transportManagementRegionId,
});
