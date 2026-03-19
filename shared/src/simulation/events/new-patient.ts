import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const newPatientEventSchema = simulationEventSchema.extend({
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
