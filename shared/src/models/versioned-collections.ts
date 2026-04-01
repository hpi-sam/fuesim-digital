import { z } from 'zod';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';

// This is typed separately in case we ever want to have a more complex visibility type
export const collectionVisibilitySchema = z.string();

export type CollectionVisibility = z.infer<typeof collectionVisibilitySchema>;

export const collectionEntityIdSchema = z
    .string()
    .regex(/^set_entity_.+$/u)
    .brand<'SetEntityId'>();
export type CollectionEntityId = z.infer<typeof collectionEntityIdSchema>;
export const isCollectionEntityId = (
    value: string | null
): value is CollectionEntityId =>
    collectionEntityIdSchema.safeParse(value).success;

export const collectionVersionIdSchema = z
    .string()
    .regex(/^set_version_.+$/u)
    .brand<'SetVersionId'>();
export type CollectionVersionId = z.infer<typeof collectionVersionIdSchema>;
export const isCollectionVersionId = (
    value: string
): value is CollectionVersionId =>
    collectionVersionIdSchema.safeParse(value).success;

export const collectionDtoSchema = z.object({
    ...stateVersionedEntitySchema.shape,
    versionId: collectionVersionIdSchema,
    entityId: collectionEntityIdSchema,
    title: z.string(),
    description: z.string(),
    visibility: collectionVisibilitySchema,
    draftState: z.boolean(),
});

export type CollectionDto = z.infer<typeof collectionDtoSchema>;

// This is sorted by permission level, so the order matters
export const collectionRelationshipTypeAllowedValues = [
    'viewer',
    'editor',
    'admin',
] as const;
export const collectionRelationshipTypeSchema = z.enum(
    collectionRelationshipTypeAllowedValues
);
export type CollectionRelationshipType = z.infer<
    typeof collectionRelationshipTypeSchema
>;

export const collectionRelationshipTypesDisplayNames: {
    [key in (typeof collectionRelationshipTypeAllowedValues)[number]]: string;
} = {
    admin: 'Admin',
    editor: 'Bearbeiter',
    viewer: 'Betrachter',
};

export function checkCollectionRole(currentRole: CollectionRelationshipType) {
    const roleCompare = (desiredRole: CollectionRelationshipType): number => {
        const desiredRoleIndex =
            collectionRelationshipTypeAllowedValues.indexOf(desiredRole);
        const currentRoleIndex =
            collectionRelationshipTypeAllowedValues.indexOf(currentRole);
        return currentRoleIndex - desiredRoleIndex;
    };

    return {
        isStrictly: (desiredRole: CollectionRelationshipType) =>
            roleCompare(desiredRole) === 0,
        isAtLeast: (desiredRole: CollectionRelationshipType) =>
            roleCompare(desiredRole) >= 0,
        indexOf: () =>
            collectionRelationshipTypeAllowedValues.indexOf(currentRole),
    };
}

export const collectionRelationshipDtoSchema = z.strictObject({
    id: z.string(),
    collection: collectionEntityIdSchema,
    userId: z.string(),
    role: collectionRelationshipTypeSchema,
});
export type CollectionRelationshipDto = z.infer<
    typeof collectionRelationshipDtoSchema
>;

export const versionedCollectionPartialSchema = z.strictObject({
    entityId: collectionEntityIdSchema,
    versionId: collectionVersionIdSchema,
});
export type VersionedCollectionPartial = z.infer<
    typeof versionedCollectionPartialSchema
>;
