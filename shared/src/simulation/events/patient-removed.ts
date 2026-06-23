import { z } from 'zod';
import type { Immutable } from 'immer';
import { type UUID, uuidSchema } from '../../utils/uuid.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientRemovedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
    type: z.literal('patientRemovedEvent'),
    patientId: uuidSchema,
});
export type PatientRemovedEvent = Immutable<
    z.infer<typeof patientRemovedEventSchema>
>;

export function newPatientRemovedEvent(patientId: UUID): PatientRemovedEvent {
    return {
        type: 'patientRemovedEvent',
        patientId,
    };
}
