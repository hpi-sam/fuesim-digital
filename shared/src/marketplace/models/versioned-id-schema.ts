import { z } from 'zod';

/// COLLECTIONS
export const collectionEntityIdSchema = z
    .string()
    .regex(/^set_entity_.+$/u)
    .brand<'SetEntityId'>();
export type CollectionEntityId = z.infer<typeof collectionEntityIdSchema>;
export function isCollectionEntityId(
    value: string | null
): value is CollectionEntityId {
    return collectionEntityIdSchema.safeParse(value).success;
}

export const collectionVersionIdSchema = z
    .string()
    .regex(/^set_version_.+$/u)
    .brand<'SetVersionId'>();
export type CollectionVersionId = z.infer<typeof collectionVersionIdSchema>;
export function isCollectionVersionId(
    value: string
): value is CollectionVersionId {
    return collectionVersionIdSchema.safeParse(value).success;
}

export const versionedCollectionPartialSchema = z.strictObject({
    entityId: collectionEntityIdSchema,
    versionId: collectionVersionIdSchema,
});
export type VersionedCollectionPartial = z.infer<
    typeof versionedCollectionPartialSchema
>;

/// ELEMENTS
export const elementEntityIdSchema = z
    .string()
    .regex(/^element_entity_.+$/u)
    .brand<'ElementEntityId'>();
export type ElementEntityId = z.infer<typeof elementEntityIdSchema>;
export function isElementEntityId(
    value: string | null
): value is ElementEntityId {
    return elementEntityIdSchema.safeParse(value).success;
}

export const elementVersionIdSchema = z
    .string()
    .regex(/^element_version_.+$/u)
    .brand<'ElementVersionId'>();
export type ElementVersionId = z.infer<typeof elementVersionIdSchema>;
export function isElementVersionId(value: string): value is ElementVersionId {
    return elementVersionIdSchema.safeParse(value).success;
}

export const versionedElementPartialSchema = z.strictObject({
    entityId: elementEntityIdSchema,
    versionId: elementVersionIdSchema,
});
export type VersionedElementPartial = z.infer<
    typeof versionedElementPartialSchema
>;
