import { z } from 'zod';
import type { Tag } from './tag.js';
import { tagSchema } from './tag.js';

export const logEntrySchema = z.strictObject({
    description: z.string().nonempty(),
    tags: z.array(tagSchema),
    timestamp: z.number(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

export function newLogEntry(
    description: string,
    tags: Tag[],
    timestamp: number
): LogEntry {
    return { description, tags, timestamp };
}
