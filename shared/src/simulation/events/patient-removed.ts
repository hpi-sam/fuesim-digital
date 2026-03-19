import { z } from 'zod';
import type { UUID } from '../../utils/index.js';
import { uuidSchema } from '../../utils/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientRemovedEventSchema = simulationEventSchema.extend({
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
