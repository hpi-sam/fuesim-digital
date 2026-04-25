import { z } from 'zod';
import type {
    ElementEntityId
} from './versioned-id-schema.js';
import {
    collectionEntityIdSchema,
    elementEntityIdSchema,
    elementVersionIdSchema,
} from './versioned-id-schema.js';
import type { Element as FuesimElement } from './../../models/element.js';
import { Immutable } from 'immer';

export const versionedElementModel = z.strictObject({
    entityId: elementEntityIdSchema,
    versionId: elementVersionIdSchema,
    usedBy: z.array(collectionEntityIdSchema),
});


export function getEntityIdFromElement(element: FuesimElement | Immutable<FuesimElement>): ElementEntityId | undefined {
    if ('entityId' in element) {
        return element.entityId;
    }
    return undefined;
}
