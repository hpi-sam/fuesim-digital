import { z } from 'zod';
import type { Immutable } from 'immer';
import { uuid, uuidSchema } from '../utils/uuid.js';
import { uuidSetSchema } from '../utils/uuid-set.js';

export const hospitalSchema = z.strictObject({
    id: uuidSchema,
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
export type Hospital = Immutable<z.infer<typeof hospitalSchema>>;

export function newHospital(name: string, transportDuration: number): Hospital {
    return {
        id: uuid(),
        type: 'hospital',
        name,
        transportDuration,
        patientIds: {},
    };
}
