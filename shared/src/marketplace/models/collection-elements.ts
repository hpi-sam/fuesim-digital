import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ImmutableInfer } from '../../utils/infer.js';
import { collectionDtoSchema } from './collection.js';
import type { ElementDto } from './versioned-elements.js';
import { elementDtoSchema } from './versioned-elements.js';
import type { CollectionElementType } from './collection-element-type.js';

// TODO: Improve this naming
export const collectionElementsSingleSchema = z.strictObject({
    collection: collectionDtoSchema,
    elements: z.array(elementDtoSchema),
});
export type CollectionElementsSingle = z.infer<
    typeof collectionElementsSingleSchema
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
export const collectionElementsDtoSchema = z.strictObject({
    /**
     * Elements directly included in the collection
     */
    direct: z.array(elementDtoSchema),

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

export type CollectionElementsDto = ImmutableInfer<
    typeof collectionElementsDtoSchema
>;

export function gatherCollectionElements(elements: CollectionElementsDto) {
    return {
        allDirectElements(): Immutable<ElementDto[]> {
            return elements.direct;
        },
        allImportedElements(): Immutable<ElementDto[]> {
            return elements.imported.flatMap((imported) => imported.elements);
        },
        allReferenceElements(): Immutable<ElementDto[]> {
            return elements.references.flatMap(
                (reference) => reference.elements
            );
        },
        allVisibleElements(): Immutable<ElementDto[]> {
            return [
                ...elements.direct,
                ...elements.imported.flatMap((imported) => imported.elements),
            ];
        },
        allElements(): Immutable<ElementDto[]> {
            return [
                ...this.allVisibleElements(),
                ...elements.references.flatMap(
                    (reference) => reference.elements
                ),
            ];
        },
    };
}
