import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const newPatientEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('newPatientEvent'),
    patientId: uuidSchema,
});
export type NewPatientEvent = z.infer<typeof newPatientEventSchema>;

export function newNewPatientEvent(patientId: UUID): NewPatientEvent {
    return {
        type: 'newPatientEvent',
        patientId,
    };
}
