import z from "zod";
import { collectionEntityIdSchema } from "./versioned-id-schema.js";

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
    admin: 'Besitzer',
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
        isAtMost: (desiredRole: CollectionRelationshipType) =>
            roleCompare(desiredRole) <= 0,
        indexOf: () =>
            collectionRelationshipTypeAllowedValues.indexOf(currentRole),
    };
}
