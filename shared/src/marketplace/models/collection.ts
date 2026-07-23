import { z } from 'zod';
import { organisationIdSchema } from '../../ids.js';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';
import {
    collectionVersionIdSchema,
    collectionEntityIdSchema,
} from './versioned-id-schema.js';
import { collectionVisibilitySchema } from './collection-visibility.js';
import {
    checkCollectionOrganisationRole,
    collectionOrganisationRelationshipTypeSchema,
} from './collection-relationship.js';

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
    relationship: collectionOrganisationRelationshipTypeSchema,
    // This is nullable because the we have embeddeed collections.
    // In the future, we should also have embeddeed organisations
    // So that we can remove this nullable and make it required.
    ownerOrganisationId: organisationIdSchema.nullish(),
    userCollectionRelationships: z.array(
        z.object({
            id: organisationIdSchema,
            name: z.string(),
        })
    ),
});

export type ExtendedCollectionVersion = z.infer<
    typeof extendedCollectionVersionSchema
>;

export function extendedCollectionVersionReducer(
    collectionVersions: ExtendedCollectionVersion[]
) {
    return collectionVersions.reduce<ExtendedCollectionVersion[]>(
        (acc, curr) => {
            const existingCollection = acc.find(
                (c) => c.entityId === curr.entityId
            );
            if (!existingCollection) {
                acc.push(curr);
            } else {
                // Make sure we always show the highest role of the user in the collection
                if (
                    checkCollectionOrganisationRole(
                        curr.relationship
                    ).indexOf() >
                    checkCollectionOrganisationRole(
                        existingCollection.relationship
                    ).indexOf()
                ) {
                    existingCollection.relationship = curr.relationship;
                }
                if (
                    existingCollection.userCollectionRelationships.every(
                        (f) => f.id !== curr.userCollectionRelationships[0]!.id
                    )
                ) {
                    existingCollection.userCollectionRelationships.push(
                        ...curr.userCollectionRelationships
                    );
                }
            }
            return acc;
        },
        []
    );
}
