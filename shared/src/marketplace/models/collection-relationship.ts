import { z } from 'zod';
import type { Immutable } from 'immer';
import { organisationMembershipRoleSchema } from '../../interfaces/organisation.js';

// INFO: This is sorted by permission level, so the order matters
// The higher the index, the more permissions the role has.
export const collectionOrganisationRelationshipTypeAllowedValues = [
    'other',
    'viewer',
    'owner',
] as const;

export const collectionOrganisationRelationshipTypeDisplayNames: {
    [key in CollectionOrganisationRelationshipType]: string;
} = {
    owner: 'Besitzer',
    viewer: 'Betrachter',
    other: 'Andere',
};

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

export const collectionMembershipRoleAllowedValues = [
    'other',
    ...organisationMembershipRoleSchema.values,
] as const;
export const collectionMembershipRole = z.literal(
    collectionMembershipRoleAllowedValues
);

export type CollectionMembershipRole = Immutable<
    z.infer<typeof collectionMembershipRole>
>;

export function checkCollectionMembershipRole(
    currentRole: CollectionMembershipRole
) {
    const roleCompare = (desiredRole: CollectionMembershipRole): number => {
        const desiredRoleIndex =
            collectionMembershipRoleAllowedValues.indexOf(desiredRole);
        const currentRoleIndex =
            collectionMembershipRoleAllowedValues.indexOf(currentRole);
        return currentRoleIndex - desiredRoleIndex;
    };

    return {
        isStrictly: (desiredRole: CollectionMembershipRole) =>
            roleCompare(desiredRole) === 0,
        isAtLeast: (desiredRole: CollectionMembershipRole) =>
            roleCompare(desiredRole) >= 0,
        isAtMost: (desiredRole: CollectionMembershipRole) =>
            roleCompare(desiredRole) <= 0,
        indexOf: () =>
            collectionMembershipRoleAllowedValues.indexOf(currentRole),
    };
}
