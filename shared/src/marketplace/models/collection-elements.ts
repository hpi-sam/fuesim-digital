import { z } from 'zod';
import type { ImmutableInfer } from '../../utils/infer.js';
import { collectionVersionSchema } from './collection.js';
import type { CollectionElementType } from './collection-element-type.js';
import type { TemplateVersion } from './marketplace-element.js';
import { templateVersionSchema } from './marketplace-element.js';

// TODO: Improve this naming
export const collectionElementsSingleSchema = z.strictObject({
    collection: collectionVersionSchema,
    elements: z.array(templateVersionSchema),
});
export type CollectionElementsSingle = ImmutableInfer<
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

export function gatherCollectionElements(elements: CollectionElements) {
    return {
        allDirectElements(): TemplateVersion[] {
            return elements.direct;
        },
        allReferenceElements(): TemplateVersion[] {
            return elements.references.flatMap(
                (reference) => reference.elements
            );
        },
        allImportedElements(): TemplateVersion[] {
            return elements.imported.flatMap((imported) => imported.elements);
        },
        allVisibleElements(): TemplateVersion[] {
            return [
                ...elements.direct,
                ...elements.imported.flatMap((imported) => imported.elements),
            ];
        },
        allElements(): TemplateVersion[] {
            return [
                ...this.allVisibleElements(),
                ...elements.references.flatMap(
                    (reference) => reference.elements
                ),
            ];
        },
    };
}
