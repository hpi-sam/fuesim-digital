import { z } from 'zod';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import {
    collectionVersionIdSchema,
    collectionEntityIdSchema,
} from './versioned-id-schema.js';
import { collectionVisibilitySchema } from './collection-visibility.js';
import { collectionRelationshipTypeSchema } from './collection-relationship.js';

export const collectionVersionSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    versionId: collectionVersionIdSchema,
    entityId: collectionEntityIdSchema,
    title: z.string(),
    description: z.string(),
    visibility: collectionVisibilitySchema,
    draftState: z.boolean(),
    archived: z.boolean(),
});

export type CollectionVersion = z.infer<typeof collectionVersionSchema>;

export const extendedCollectionVersionSchema = z.object({
    ...collectionVersionSchema.shape,
    elementCount: z.number(),
    relationship: collectionRelationshipTypeSchema,
});

export type ExtendedCollectionVersion = z.infer<
    typeof extendedCollectionVersionSchema
>;
