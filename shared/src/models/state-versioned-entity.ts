import { z } from 'zod';
import { stringToDate } from './utils/date.js';

// WARNING: This does not include versionId and entityId, since those have specific drizzle schemas
export const stateVersionedEntitySchema = z.object({
    version: z.number(),
    stateVersion: z.number(),
    createdAt: stringToDate,
    editedAt: stringToDate,
});
