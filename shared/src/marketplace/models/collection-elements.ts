import { z } from 'zod';
import { collectionDtoSchema } from './collection.js';
import { elementDtoSchema, ElementDto } from './versioned-elements.js';

//TODO: Improve this naming
export const collectionElementsSingleSchema = z.strictObject({
    collection: collectionDtoSchema,
    elements: z.array(elementDtoSchema),
});
export type CollectionElementsSingle = z.infer<
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
});

export type CollectionElementsDto = z.infer<typeof collectionElementsDtoSchema>;

export function gatherCollectionElements(elements: CollectionElementsDto) {
    return {
        allVisibleElements(): ElementDto[] {
            return [
                ...elements.direct,
                ...elements.imported.flatMap((imported) => imported.elements),
            ];
        },
        allElements(): ElementDto[] {
            return [
                ...this.allVisibleElements(),
                ...elements.references.flatMap(
                    (reference) => reference.elements
                ),
            ];
        },
    };
}
