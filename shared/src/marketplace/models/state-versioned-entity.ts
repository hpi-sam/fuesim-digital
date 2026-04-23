import { z } from 'zod';
import { stringToDate } from '../../models/utils/date.js';

// WARNING: This does not include versionId and entityId, since those have specific drizzle schemas
// Thus those properties must be specified by the implementing/extending schema
export const stateVersionedEntitySchema = z.object({
    version: z.number(),
    stateVersion: z.number(),
    createdAt: stringToDate,
    editedAt: stringToDate,
});
