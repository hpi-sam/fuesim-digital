import { z } from 'zod';
import { uuid, uuidSetSchema } from '../utils/index.js';

export const hospitalSchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('hospital'),
    name: z.string(),
    /**
     * The time in ms it takes to transport a patient to this hospital
     */
    transportDuration: z.number().nonnegative(),
    /**
     * These ids reference a hospital patient patientId
     */
    patientIds: uuidSetSchema,
});
export type Hospital = z.infer<typeof hospitalSchema>;

export function newHospital(name: string, transportDuration: number): Hospital {
    return {
        id: uuid(),
        type: 'hospital',
        name,
        transportDuration,
        patientIds: {},
    };
}
