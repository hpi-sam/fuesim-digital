import { z } from 'zod';
import {
    type PatientStatus,
    patientStatusSchema,
} from '../../models/utils/patient-status.js';
import type { ResourceDescription } from '../../models/utils/resource-description.js';
import { simulationEventSchema } from './simulation-event.js';

export const patientsCountedEventSchema = z.strictObject({
    ...simulationEventSchema.shape,
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
