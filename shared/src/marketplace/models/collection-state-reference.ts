import { z } from 'zod';
import type { Immutable } from 'immer';
import { collectionVersionSchema } from './collection.js';
import { versionedElementPartialSchema } from './versioned-id-schema.js';

export const collectionStateReferenceSchema = z.object({
    ...collectionVersionSchema.shape,
    elements: z.object({
        direct: z.array(versionedElementPartialSchema),
        imported: z.array(
            z.object({
                collection: collectionVersionSchema,
                elements: z.array(versionedElementPartialSchema),
            })
        ),
        references: z.array(
            z.object({
                collection: collectionVersionSchema,
                elements: z.array(versionedElementPartialSchema),
            })
        ),
    }),
});

export type CollectionStateReference = Immutable<
    z.infer<typeof collectionStateReferenceSchema>
>;
