import { z } from 'zod';
import type { Immutable } from 'immer';
import { collectionVersionSchema } from './collection.js';
import { templateVersionSchema } from './versioned-elements.js';
import type { CollectionElementType } from './collection-element-type.js';
import {
    versionedCollectionPartialSchema,
    versionedElementPartialSchema,
} from './versioned-id-schema.js';

export const collectionElementsSingleSchema = z.strictObject({
    collection: collectionVersionSchema,
    elements: z.array(templateVersionSchema),
});
export type CollectionElementsSingle = Immutable<
    z.infer<typeof collectionElementsSingleSchema>
>;

/**
 * The Marketplace Dependency System is structured as follows:
 *
 * An Element always belongs to exactly 1 Collection-Entity (but n>=1 Collection-Versions)
 * -> `direct` elements are the elements directly belonging to the collection
 *
 *   A Collection-Version can import n>=0 other Collection-Versions.
 *   -> `imported` elements are the `direct` elements of those imported Collection-Versions
 *   (but not their `imported` elements)
 *
 *   If an imported Collection-Version B imports other Collection-Versions C,
 *   AND the `direct` elements of B use any elements of C, those elements of C
 *   are `references` of the original Collection-Version A.
 *
 * Example:
 *
 * Collection A [a1, a2, a3]
 * ├── Collection B [b1, b2, b3]
 * │   ├── Collection C [c1, c2, c3]
 * ├── Collection D [d1, d2, d3]
 *
 * results in:
 *   direct: [a1, a2, a3]
 *   imported: [b1, b2, b3, d1, d2, d3]
 *   references: [c1, c2, c3] (if any of b1, b2, b3 use any of c1, c2, c3)
 *
 */
export const collectionElementsSchema = z.strictObject({
    /**
     * Elements directly included in the collection
     */
    direct: z.array(templateVersionSchema),

    /**
     * Elements included in the collection via imports.
     * This only includes import-levels visible to the user
     * (e.g. only first level imports for collections in collections)
     */
    imported: z.array(collectionElementsSingleSchema),

    /**
     * Elements being used by collection elements,
     * but not directly visible to the user
     * (e.g. elements being used in elements of collections in collections)
     */
    references: z.array(collectionElementsSingleSchema),
} satisfies { [T in CollectionElementType]: unknown });

export type CollectionElements = z.infer<typeof collectionElementsSchema>;

export const collectionVersionStructureSchema = z.strictObject({
    direct: z.array(versionedElementPartialSchema),
    imported: z.array(
        z.object({
            collection: versionedCollectionPartialSchema,
            elements: z.array(versionedElementPartialSchema),
        })
    ),
    references: z.array(
        z.object({
            collection: versionedCollectionPartialSchema,
            elements: z.array(versionedElementPartialSchema),
        })
    ),
});

export type CollectionVersionStructure = z.infer<
    typeof collectionVersionStructureSchema
>;

export const collectionVersionStructureWithMetadataSchema = z.strictObject({
    ...collectionVersionStructureSchema.shape,
    title: z.string(),
    version: z.number(),
});

export type CollectionVersionStructureWithMetadata = z.infer<
    typeof collectionVersionStructureWithMetadataSchema
>;

export interface CollectionElementsAny<T = any, C = any> {
    direct: T[];
    imported: {
        collection: C;
        elements: T[];
    }[];
    references: {
        collection: C;
        elements: T[];
    }[];
}

export function gatherAllDirectCollectionElements<T = any>(
    elements: CollectionElementsAny<T>
): T[] {
    return elements.direct;
}

export function gatherAllReferencedCollectionElements<T = any>(
    elements: CollectionElementsAny<T>
): T[] {
    return elements.references.flatMap((reference) => reference.elements);
}

export function gatherAllImportedCollectionElements<T = any>(
    elements: CollectionElementsAny<T>
): T[] {
    return elements.imported.flatMap((imported) => imported.elements);
}

export function gatherAllVisibleCollectionElements<T = any>(
    elements: CollectionElementsAny<T>
): T[] {
    return [
        ...elements.direct,
        ...elements.imported.flatMap((imported) => imported.elements),
    ];
}

export function gatherAllCollectionElements<T = any>(
    elements: CollectionElementsAny<T>
): T[] {
    return [
        ...gatherAllVisibleCollectionElements(elements),
        ...elements.references.flatMap((reference) => reference.elements),
    ];
}
