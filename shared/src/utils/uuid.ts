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
