import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ElementEntityId } from './versioned-id-schema.js';
import {
    elementEntityIdSchema,
    elementVersionIdSchema,
} from './versioned-id-schema.js';
import type { Element as FuesimElement } from './../../models/element.js';
import { collectionElementTypeSchema } from './collection-element-type.js';

export const versionedElementModelSchema = z.strictObject({
    entity: z.object({
        entityId: elementEntityIdSchema,
        versionId: elementVersionIdSchema,
        type: collectionElementTypeSchema,
    }),
});

export type VersionedElementModel = z.infer<typeof versionedElementModelSchema>;

export function getEntityIdFromElement(
    element: FuesimElement | Immutable<FuesimElement>
): ElementEntityId | undefined {
    if ('entity' in element) {
        return element.entity?.entityId;
    }
    return undefined;
}
