import { z } from 'zod';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import {
    collectionVersionIdSchema,
    collectionEntityIdSchema,
} from './versioned-id-schema.js';
import { collectionVisibilitySchema } from './collection-visibility.js';
import { collectionRelationshipTypeSchema } from './collection-relationship.js';

export const collectionDtoSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    versionId: collectionVersionIdSchema,
    entityId: collectionEntityIdSchema,
    title: z.string(),
    description: z.string(),
    visibility: collectionVisibilitySchema,
    draftState: z.boolean(),
    archived: z.boolean(),
    elementCount: z.number(),
});

export type CollectionDto = z.infer<typeof collectionDtoSchema>;

export const extendedCollectionDtoSchema = z.object({
    ...collectionDtoSchema.shape,
    elementCount: z.number(),
    relationship: collectionRelationshipTypeSchema,
});

export type ExtendedCollectionDto = z.infer<typeof extendedCollectionDtoSchema>;
