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
export type CollectionElementsSingle = ImmutableInfer<
    typeof collectionElementsSingleSchema
>;

export const collectionElementsDtoSchema = z.strictObject({
    /**
     * Elements directly included in the collection
     */
    direct: z.array(elementDtoSchema),

    /**
     * Elements included in the collection via imports.
     * This only inlcudes import-levels visible to the user
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
