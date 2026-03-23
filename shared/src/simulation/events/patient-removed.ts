import { z } from 'zod';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientRemovedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('patientRemovedEvent'),
    patientId: uuidSchema,
});
export type PatientRemovedEvent = z.infer<typeof patientRemovedEventSchema>;

export function newPatientRemovedEvent(patientId: UUID): PatientRemovedEvent {
    return {
        type: 'patientRemovedEvent',
        patientId,
    };
}
