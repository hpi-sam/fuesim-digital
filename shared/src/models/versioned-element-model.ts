import z from 'zod';
import { collectionEntityIdSchema } from './versioned-collections.js';
import { versionedElementPartialSchema } from './versioned-elements.js';

export const versionedElementModel = z.strictObject({
    ...versionedElementPartialSchema.shape,
    usedBy: z.array(collectionEntityIdSchema),
});
