import z from 'zod';
import { stateVersionedEntitySchema } from './state-versioned-entity.js';

export const collectionVisibilitySchema = z.enum(['private', 'public']);

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
    owner: z.string(),
    draftState: z.boolean(),
});

export type CollectionDto = z.infer<typeof collectionDtoSchema>;

export const versionedCollectionPartialSchema = z.strictObject({
    entityId: collectionEntityIdSchema,
    versionId: collectionVersionIdSchema,
});
export type VersionedCollectionPartial = z.infer<
    typeof versionedCollectionPartialSchema
>;
