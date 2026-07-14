import { z } from 'zod';
import { collectionEntityIdSchema } from './versioned-id-schema.js';

// INFO: This is sorted by permission level, so the order matters
export const collectionOrganisationRelationshipTypeAllowedValues = [
    'owner',
    'viewer',
    'other',
] as const;

export const collectionOrganisationRelationshipTypeSchema = z.enum(
    collectionOrganisationRelationshipTypeAllowedValues
);
export type CollectionOrganisationRelationshipType = z.infer<
    typeof collectionOrganisationRelationshipTypeSchema
>;

export function checkCollectionOrganisationRole(
    currentRole: CollectionOrganisationRelationshipType
) {
    const roleCompare = (
        desiredRole: CollectionOrganisationRelationshipType
    ): number => {
        const desiredRoleIndex =
            collectionOrganisationRelationshipTypeAllowedValues.indexOf(
                desiredRole
            );
        const currentRoleIndex =
            collectionOrganisationRelationshipTypeAllowedValues.indexOf(
                currentRole
            );
        return currentRoleIndex - desiredRoleIndex;
    };

    return {
        isStrictly: (desiredRole: CollectionOrganisationRelationshipType) =>
            roleCompare(desiredRole) === 0,
        isAtLeast: (desiredRole: CollectionOrganisationRelationshipType) =>
            roleCompare(desiredRole) >= 0,
        isAtMost: (desiredRole: CollectionOrganisationRelationshipType) =>
            roleCompare(desiredRole) <= 0,
        indexOf: () =>
            collectionOrganisationRelationshipTypeAllowedValues.indexOf(
                currentRole
            ),
    };
}

/// ///////////////// DEPRECATED //////////////////////
// INFO: This is sorted by permission level, so the order matters
export const collectionRelationshipTypeAllowedValues = [
    // assined, when collection is public and user has no specific role
    'other',
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

export const collectionRelationshipDtoSchema = z.strictObject({
    id: z.string(),
    collection: collectionEntityIdSchema,
    userId: z.string(),
    role: collectionRelationshipTypeSchema,
});
export type CollectionRelationshipDto = z.infer<
    typeof collectionRelationshipDtoSchema
>;

export const collectionRelationshipTypesDisplayNames: {
    [key in (typeof collectionRelationshipTypeAllowedValues)[number]]: string;
} = {
    other: 'Sonstige',
    viewer: 'Betrachter',
    editor: 'Bearbeiter',
    admin: 'Besitzer',
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
        isAtMost: (desiredRole: CollectionRelationshipType) =>
            roleCompare(desiredRole) <= 0,
        indexOf: () =>
            collectionRelationshipTypeAllowedValues.indexOf(currentRole),
    };
}
