import { dependencyTreeConflictResolution } from './conflict-detection.js';
import type { VersionedCollectionPartial } from './models/collection.js';
import type { VersionedElementPartial } from './models/versioned-elements.js';
import type {
    CollectionVersionId,
    ElementVersionId,
    CollectionEntityId,
} from './models/versioned-id-schema.js';

describe('Conflict Detection', () => {
    describe('dependencyTreeConflictResolution', () => {
        it('should detect multiple collection versions in strict levels', async () => {
            type ColPartial = VersionedCollectionPartial & {
                dependsOn: CollectionVersionId[];
                elements: (VersionedElementPartial & {
                    dependsOn: ElementVersionId[];
                })[];
            };

            const cv = (s: string): CollectionVersionId =>
                s as CollectionVersionId;
            const ce = (s: string): CollectionEntityId =>
                s as CollectionEntityId;

            const baseCollection: ColPartial = {
                entityId: ce('c1'),
                versionId: cv('c1v1'),
                dependsOn: [cv('c3v1'), cv('c4v1')],
                elements: [],
            };

            const collections: ColPartial[] = [
                baseCollection,
                {
                    entityId: ce('c2'),
                    versionId: cv('c2v1'),
                    dependsOn: [],
                    elements: [],
                },
                {
                    entityId: ce('c2'),
                    versionId: cv('c2v2'),
                    dependsOn: [],
                    elements: [],
                },
                {
                    entityId: ce('c3'),
                    versionId: cv('c3v1'),
                    dependsOn: [cv('c2v2')],
                    elements: [],
                },
                {
                    entityId: ce('c4'),
                    versionId: cv('c4v1'),
                    dependsOn: [cv('c2v1')],
                    elements: [],
                },
            ];

            const result = await dependencyTreeConflictResolution(
                baseCollection,
                { strictLevels: 2 },
                {
                    async getCollectionDependencies(collectionVersionId) {
                        const mainCollection = collections.find(
                            (c) => c.versionId === collectionVersionId
                        );
                        if (!mainCollection) {
                            throw new Error(
                                `Collection with versionId ${collectionVersionId} not found`
                            );
                        }
                        return mainCollection.dependsOn.map((depVersionId) => {
                            const depCollection = collections.find(
                                (c) => c.versionId === depVersionId
                            );
                            if (!depCollection) {
                                throw new Error(
                                    `Collection with versionId ${depVersionId} not found`
                                );
                            }
                            return depCollection;
                        });
                    },
                    async getCollectionElements(collectionVersionId) {
                        return [];
                    },
                }
            );
            console.log(JSON.stringify(result, null, 2));
        });
    });
});
