import { v4 } from 'uuid';
import { z } from 'zod';

/**
 * Generates a v4 uuid
 */
export function uuid(): UUID {
    // this is an extra function to make the imports easier (no `v4 as uuid` that can't be auto-generated)
    return v4();
}

export type UUID = string;

export const uuidSchema = z.uuidv4();

export function getIdMapSchema<S extends z.core.$ZodType<{ id: UUID }>>(
    schema: S
) {
    return z.record(uuidSchema, schema).refine(
        (val) => {
            for (const [key, value] of Object.entries(val)) {
                if (key !== value.id) {
                    return false;
                }
            }
            return true;
        },
        {
            error: "There is an object that's saved with another key than the object's id.",
        }
    );
}
