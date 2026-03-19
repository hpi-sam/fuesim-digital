import { z } from 'zod';
import {
    type PatientStatus,
    patientStatusSchema,
    type ResourceDescription,
} from '../../models/index.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientsCountedEventSchema = simulationEventSchema.extend({
    type: z.literal('patientsCountedEvent'),
    patientCount: z.record(patientStatusSchema, z.number()),
});
export type PatientsCountedEvent = z.infer<typeof patientsCountedEventSchema>;

export function newPatientsCountedEvent(
    patientCount: ResourceDescription<PatientStatus>
): PatientsCountedEvent {
    return {
        type: 'patientsCountedEvent',
        patientCount,
    };
}
