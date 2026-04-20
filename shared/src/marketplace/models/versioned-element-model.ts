import z from 'zod';
import {
    collectionEntityIdSchema,
    elementEntityIdSchema,
    elementVersionIdSchema,
} from './versioned-id-schema.js';

export const versionedElementModel = z.strictObject({
    entityId: elementEntityIdSchema,
    versionId: elementVersionIdSchema,
    usedBy: z.array(collectionEntityIdSchema),
});
