import { z } from 'zod';

/// COLLECTIONS
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
export const isElementEntityId = (
    value: string | null
): value is ElementEntityId => elementEntityIdSchema.safeParse(value).success;

export const elementVersionIdSchema = z
    .string()
    .regex(/^element_version_.+$/u)
    .brand<'ElementVersionId'>();
export type ElementVersionId = z.infer<typeof elementVersionIdSchema>;
export const isElementVersionId = (value: string): value is ElementVersionId =>
    elementVersionIdSchema.safeParse(value).success;

export const versionedElementPartialSchema = z.strictObject({
    entityId: elementEntityIdSchema,
    versionId: elementVersionIdSchema,
});
export type VersionedElementPartial = z.infer<
    typeof versionedElementPartialSchema
>;
