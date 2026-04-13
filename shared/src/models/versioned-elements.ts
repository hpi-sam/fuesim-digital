import * as z from 'zod';
import type { VersionedElementContent } from './utils/versioned-element-content.js';
import { collectionEntityIdSchema } from './index.js';

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

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export const versionedElementTypeDisplayNames: Record<
    VersionedElementContent['type'],
    {
        singular: string;
        plural: string;
    }
> = {
    vehicleTemplate: { singular: 'Fahrzeug', plural: 'Fahrzeuge' },
    alarmGroup: { singular: 'Alarmgruppe', plural: 'Alarmgruppen' },
} as const;
export function getVersionedElementTypeDisplayName(
    versionedElementType: VersionedElementContent['type']
): { singular: string; plural: string } {
    return versionedElementTypeDisplayNames[versionedElementType];
}
