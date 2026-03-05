import { z } from 'zod';
import { uuid } from '../utils/index.js';

export const eocLogEntrySchema = z.strictObject({
    id: z.uuidv4(),
    type: z.literal('eocLogEntry'),
    exerciseTimestamp: z.int(),
    message: z.string().max(65535),
    isPrivate: z.boolean(),
    // Directly save the name instead of a reference to keep the name after a disconnect
    clientName: z.string().max(255),
});

export type EocLogEntry = z.infer<typeof eocLogEntrySchema>;

export function newEocLogEntry(
    exerciseTimestamp: number,
    message: string,
    clientName: string,
    isPrivate: boolean
): EocLogEntry {
    return {
        id: uuid(),
        type: 'eocLogEntry',
        exerciseTimestamp,
        message,
        isPrivate,
        clientName,
    };
}
