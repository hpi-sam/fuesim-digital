import { z } from 'zod';
import type {
    
    ElementVersionId,
    VersionedCollectionPartial,
} from './models/versioned-id-schema.js';
import { elementVersionIdSchema } from './models/versioned-id-schema.js';
import { templateVersionSchema } from './models/versioned-elements.js';
import type { TemplateVersion } from './models/versioned-elements.js';
import type {
    CollectionElements} from './models/collection-elements.js';
import {
    gatherCollectionElements,
} from './models/collection-elements.js';

const deletedTemplateVersionSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('remove'),
    old: templateVersionSchema,
    new: z.null(),
});

const updatedTemplateVersionSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('update'),
    old: templateVersionSchema,
    new: templateVersionSchema,
});

const addedTemplateVersionSchema = z.object({
    id: elementVersionIdSchema,
    type: z.literal('create'),
    old: z.null(),
    new: templateVersionSchema,
});

export const changedTemplateVersionSchema = z.union([
    deletedTemplateVersionSchema,
    updatedTemplateVersionSchema,
    addedTemplateVersionSchema,
]);

export type ChangeElementType = z.infer<
    typeof changedTemplateVersionSchema
>['type'];

export type ChangedTemplateVersion = z.infer<
    typeof changedTemplateVersionSchema
>;

export const changeDependenciesSchema = z.record(
    elementVersionIdSchema,
    z.array(templateVersionSchema)
);

export type ChangeDependencies = { [T in ElementVersionId]: TemplateVersion[] };

export function getCollectionElementDiff(
    currentElements: TemplateVersion[],
    newElements: TemplateVersion[]
): ChangedTemplateVersion[] {
    const changes: ChangedTemplateVersion[] = [];

    const currentElementEntityIds = new Set(
        currentElements.map((element) => element.entityId)
    );
    const newElementEntityIds = new Set(
        newElements.map((element) => element.entityId)
    );

    currentElements
        .filter((element) => !newElementEntityIds.has(element.entityId))
        .forEach((removedElement) => {
            changes.push({
                id: removedElement.versionId,
                type: 'remove',
                old: removedElement,
                new: null,
            });
        });

    newElements
        .filter((element) => !currentElementEntityIds.has(element.entityId))
        .forEach((addedElement) => {
            changes.push({
                id: addedElement.versionId,
                type: 'create',
                old: null,
                new: addedElement,
            });
        });

    const overlappingNew = newElements.filter((element) =>
        currentElementEntityIds.has(element.entityId)
    );

    // TODO: @Quixelation -> we should also do a content diff, to see if the content was actually significantly changed
    // But this is something for a later point (ba-thesis?)
    overlappingNew
        .map((newElement) => {
            const matchingCurrentElement = currentElements.find(
                (element) => element.entityId === newElement.entityId
            );
            if (!matchingCurrentElement) {
                throw new Error(
                    'This should not happen, since we are filtering for overlapping elements'
                );
            }
            if (newElement.versionId !== matchingCurrentElement.versionId) {
                return {
                    old: matchingCurrentElement,
                    new: newElement,
                };
            }
            return null;
        })
        .filter((v) => v !== null)
        .forEach((potentiallyUpdated) => {
            changes.push({
                id: potentiallyUpdated.new.versionId,
                type: 'update',
                old: potentiallyUpdated.old,
                new: potentiallyUpdated.new,
            });
        });

    return changes;
}

export function getCollectionElementsDiff(
    prev: {
        collection: VersionedCollectionPartial;
        elements: CollectionElements;
    }[],
    next: {
        collection: VersionedCollectionPartial;
        elements: CollectionElements;
    }[]
): {
    direct: ChangedTemplateVersion[];
    imported: ChangedTemplateVersion[];
    references: ChangedTemplateVersion[];
} {
    const combinedElements = (
        elements: { elements: CollectionElements }[]
    ): CollectionElements => ({
        direct: elements.flatMap((e) => e.elements.direct),
        imported: elements.flatMap((e) => e.elements.imported),
        references: elements.flatMap((e) => e.elements.references),
    });

    return {
        direct: getCollectionElementDiff(
            gatherCollectionElements(
                combinedElements(prev)
            ).allDirectElements(),
            gatherCollectionElements(combinedElements(next)).allDirectElements()
        ),
        imported: getCollectionElementDiff(
            gatherCollectionElements(
                combinedElements(prev)
            ).allImportedElements(),
            gatherCollectionElements(
                combinedElements(next)
            ).allImportedElements()
        ),
        references: getCollectionElementDiff(
            gatherCollectionElements(
                combinedElements(prev)
            ).allReferenceElements(),
            gatherCollectionElements(
                combinedElements(next)
            ).allReferenceElements()
        ),
    };
}
