import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const newPatientEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('newPatientEvent'),
    patientId: uuidSchema,
});
export type NewPatientEvent = Immutable<z.infer<typeof newPatientEventSchema>>;

export function newNewPatientEvent(patientId: UUID): NewPatientEvent {
    return {
        type: 'newPatientEvent',
        patientId,
    };
}
