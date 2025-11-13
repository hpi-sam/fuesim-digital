import * as z from 'zod';

export const patientTransferOccupation = z.strictObject({
    type: z.literal('patientTransferOccupation'),
    transportManagementRegionId: z.uuidv4(),
});

export type PatientTransferOccupation = z.infer<
    typeof patientTransferOccupation
>;
