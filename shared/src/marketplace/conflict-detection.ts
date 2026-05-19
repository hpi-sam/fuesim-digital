import { z } from 'zod';
import type {
    CollectionVersionId,
    ElementVersionId,
    VersionedCollectionPartial,
} from './models/versioned-id-schema.js';
import { elementVersionIdSchema } from './models/versioned-id-schema.js';
import { templateVersionSchema } from './models/versioned-elements.js';
import type { TemplateVersion } from './models/versioned-elements.js';
import { gatherCollectionElements } from './models/collection-elements.js';

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

export type ChangeDependencies = { [T in ElementVersionId]: ElementDto[] };

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
        elements: CollectionElementsDto;
    }[],
    next: {
        collection: VersionedCollectionPartial;
        elements: CollectionElementsDto;
    }[]
): {
    direct: ChangedElementDto[];
    imported: ChangedElementDto[];
    references: ChangedElementDto[];
} {
    const combinedElements = (
        elements: { elements: CollectionElementsDto }[]
    ): CollectionElementsDto => ({
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

export async function dependencyTreeConflictResolution(
    baseCollection: VersionedCollectionPartial,
    opts: {
        // levels of dependencies which are later directly visible to the user
        // 1 is used for collections in collections
        // 2 is used for collections in exercises
        strictLevels: number;
    },
    retrievers: {
        getCollectionDependencies: (
            collectionVersionId: CollectionVersionId
        ) => Promise<VersionedCollectionPartial[]>;
        getCollectionElements: (
            collectionVersionId: CollectionVersionId
        ) => Promise<TemplateVersion[]>;
    }
) {
    // -- STRICT LEVEL --
    const strictLevelCollections: VersionedCollectionPartial[] = [];
    const looseLevelCollections: VersionedCollectionPartial[] = [];
    const strictLevelElements: TemplateVersion[] = [];

    const loadDeps = async (
        collection: VersionedCollectionPartial,
        currentLevel: number
    ) => {
        if (currentLevel > opts.strictLevels) {
            looseLevelCollections.push(collection);
            return;
        }

        const elements = await retrievers.getCollectionElements(
            collection.versionId
        );
        strictLevelElements.push(...elements);

        const deps = await retrievers.getCollectionDependencies(
            collection.versionId
        );

        await Promise.all(
            deps.map(async (dep) => {
                strictLevelCollections.push(collection);
                return loadDeps(dep, currentLevel + 1);
            })
        );
    };

    await loadDeps(baseCollection, 1);

    const groupedIds = strictLevelCollections.reduce<{
        [key: string]: CollectionVersionId[];
    }>((acc, collection) => {
        acc[collection.entityId] ??= [];
        acc[collection.entityId]!.push(collection.versionId);
        return acc;
    }, {});

    if (Object.values(groupedIds).some((versions) => versions.length > 1)) {
        console.warn(
            'Conflict detected in dependency tree, multiple versions of the same collection found in strict levels',
            strictLevelCollections
        );
    }

    // -- LOOSE LEVEL --

    const looseLevelElements: TemplateVersion[] = [];

    const loadLooseDeps = async (collection: VersionedCollectionPartial) => {
        const elements = await retrievers.getCollectionElements(
            collection.versionId
        );
        looseLevelElements.push(...elements);

        const deps = await retrievers.getCollectionDependencies(
            collection.versionId
        );

        await Promise.all(
            deps.map(async (dep) =>
                // We do not check if two versions of the same collection are in the loose level,
                // since we use mix-n-match resolution for the loose level
                //
                // So we only need to check for version conflicts on the elements
                loadLooseDeps(dep)
            )
        );
    };

    await Promise.all(
        looseLevelCollections.map(async (collection) =>
            loadLooseDeps(collection)
        )
    );

    return { strictLevelCollections, groupedIds };
}
