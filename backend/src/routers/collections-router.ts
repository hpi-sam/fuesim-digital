import { Router } from 'express';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import {
    isCollectionEntityId,
    isCollectionVersionId,
    isElementEntityId,
    isElementVersionId,
    Marketplace,
} from 'fuesim-digital-shared';
import { NotFoundError } from '../utils/http.js';
import { CollectionService } from '../database/services/collection-service.js';
import { CollectionEventSender } from '../collections/collection-event-sender.js';

/**
 * Routes:
 *
 *  /
 *  -> /my
 *  -> /create
 *  -> /:collectionEntityId
 *     -> /
 *        -> GET:
 *        -> PATCH:
 *
 */

export function createCollectionsRouter(collectionService: CollectionService) {
    const router = Router();

    router.use((req, res, next) => {
        console.log(
            '[CollectionsRouter] Request received:',
            req.method,
            req.path,
            'User:',
            req.session?.user.id
        );
        next();
    });
    router.use(isAuthenticatedMiddleware);

    router.get('/my', async (req, res) => {
        const includeDraftState = req.query['includeDraftState'] === 'true';

        const result = await collectionService.getLatestCollectionsForUser(
            req.session!.user.id,
            { includeDraftState }
        );

        return res.send(
            Marketplace.Set.LoadMy.responseSchema.encode({
                result,
            })
        );
    });

    /*
     * Creates a new Collection
     */
    router.post('/create', async (req, res) => {
        const parsedBody = Marketplace.Set.Create.requestSchema.parse(req.body);

        const result = await collectionService.createCollection(
            parsedBody.title,
            req.session!.user.id
        );

        if (!result) {
            throw new Error('Failed to create exercise element set');
        }

        return res.send(
            Marketplace.Set.Create.responseSchema.encode({
                result,
            })
        );
    });

    router.use('/:setEntityId', async (req, res, next) => {
        const exerciseElementSetId = req.params.setEntityId;
        if (!isCollectionEntityId(exerciseElementSetId)) {
            return res.status(400).send({ error: 'Invalid collection id' });
        }

        const collection = await collectionService.getLatestCollectionById(
            exerciseElementSetId,
            { draftState: true }
        );
        if (!collection) {
            return res.status(404).send({ error: 'Collection not found' });
        }

        //@ts-ignore
        req.collection = collection;
        next();
        return;
    });

    /*
     * Get the metadata of the latest version of the collection
     */
    router.get('/:setEntityId', async (req, res) => {
        const collectionEntityId = req.params.setEntityId;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const result = await collectionService.getLatestCollectionById(
            collectionEntityId,
            { draftState: true }
        );
        if (!result) {
            throw new NotFoundError();
        }

        return res.send(
            Marketplace.Set.GetByEntityId.responseSchema.encode({
                result,
            })
        );
    });

    router.patch('/:setEntityId', async (req, res) => {
        const { setEntityId } = req.params;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const parsedBody = Marketplace.Set.Edit.requestSchema.parse(req.body);

        const result = await collectionService.updateCollectionMetadata(
            setEntityId,
            parsedBody
        );

        if (!result) {
            throw new Error('Failed to update exercise element set metadata');
        }

        res.send(
            Marketplace.Set.Edit.responseSchema.encode({
                result,
            })
        );
    });

    /*
     * Create a new Collection-Element in the Collection
     */
    router.post('/:setEntityId/create', async (req, res) => {
        const { setEntityId } = req.params;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const parsedBody = Marketplace.Element.Create.requestSchema.parse(
            req.body
        );

        const data = await collectionService.createExerciseObject(
            setEntityId,
            parsedBody.data
        );

        if (!data) {
            throw new Error('Failed to create exercise element object');
        }

        res.send(
            Marketplace.Element.Create.responseSchema.encode({
                newSetVersionId: data.newSetVersionId,
                result: data.result,
            })
        );
    });

    router.post(
        '/:setEntityId/dependencies/:importSetVersionId',
        async (req, res) => {
            const { setEntityId, importSetVersionId } = req.params;
            if (!isCollectionEntityId(setEntityId)) {
                throw new Error('Invalid exercise element set version id');
            }
            if (!isCollectionVersionId(importSetVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const data = await collectionService.addCollectionDependency(
                {
                    importTo: setEntityId,
                    importFrom: importSetVersionId,
                },
                { throwOnDraftState: false }
            );

            res.send(
                Marketplace.Set.Import.responseSchema.encode({
                    importedSet: {
                        collection: data.collection,
                        elements: data.elements,
                    },
                    newCollectionVersionId: data.newCollectionVersion.versionId,
                })
            );
        }
    );

    router.delete(
        '/:setEntityId/dependencies/:importSetVersionId',
        async (req, res) => {
            const { setEntityId, importSetVersionId } = req.params;
            if (!isCollectionEntityId(setEntityId)) {
                throw new Error('Invalid exercise element set version id');
            }
            if (!isCollectionVersionId(importSetVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            await collectionService.removeCollectionDependency({
                removeFrom: setEntityId,
                dependencyEntityId: importSetVersionId,
            });

            res.send({ status: 'success' });
        }
    );

    router.get('/:setEntityId/latest', async (req, res) => {
        const { setEntityId } = req.params;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set entity id');
        }

        const data = await collectionService.getLatestDraftElementsOfCollection(
            setEntityId,
            { includeDependencies: true }
        );

        res.send(
            Marketplace.Set.GetLatestElementsBySetVersionId.responseSchema.encode(
                {
                    transitive: data.transitive ?? [],
                    direct: data.direct,
                }
            )
        );
    });

    router.get('/:setEntityId/events', async (req, res) => {
        const { setEntityId } = req.params;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set entity id');
        }

        new CollectionEventSender(req, res, setEntityId, collectionService);
    });

    router.post('/:setEntityId/save', async (req, res) => {
        const { setEntityId } = req.params;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        let newCollectionState:
            | Awaited<ReturnType<typeof collectionService.saveDraftState>>
            | undefined;
        try {
            newCollectionState =
                await collectionService.saveDraftState(setEntityId);
        } catch (e) {
            res.send(
                Marketplace.Set.SaveDraftState.responseSchema.encode({
                    result: null,
                    saved: false,
                })
            );
        }

        if (!newCollectionState) {
            throw new Error('Failed to save exercise element set');
        }

        res.send(
            Marketplace.Set.SaveDraftState.responseSchema.encode({
                result: newCollectionState,
                saved: true,
            })
        );
    });

    router.post('/:setEntityId/change-visibility', async (req, res) => {
        const { setEntityId } = req.params;

        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set entity id');
        }

        const data = await collectionService.makeCollectionPublic(setEntityId);

        res.send(
            Marketplace.Set.ChangeVisibility.responseSchema.encode({
                status: 'success',
            })
        );
    });

    router.post(
        '/:setEntityId/version/:setVersionId/duplicate',
        async (req, res) => {
            const { setVersionId } = req.params;
            if (!isCollectionVersionId(setVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const createdSet =
                await collectionService.duplicateCollectionVersion(
                    setVersionId,
                    req.session!.user.id
                );

            res.send(
                Marketplace.Set.Duplicate.responseSchema.encode({
                    createdSet,
                })
            );
        }
    );

    router.get('/:setEntityId/version/:setVersionId', async (req, res) => {
        const { setEntityId, setVersionId } = req.params;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set entity id');
        }
        if (!isCollectionVersionId(setVersionId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const collection =
            await collectionService.getCollectionVersionById(setVersionId);
        if (!collection) {
            throw new NotFoundError();
        }

        res.send(
            Marketplace.Set.GetCollectionVersion.responseSchema.encode({
                result: collection,
            })
        );
    });

    router.get(
        '/:setEntityId/version/:setVersionId/elements',
        async (req, res) => {
            const { setEntityId, setVersionId } = req.params;
            if (!isCollectionEntityId(setEntityId)) {
                throw new Error('Invalid exercise element set entity id');
            }
            if (!isCollectionVersionId(setVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const data = await collectionService.getElementsOfCollectionVersion(
                setVersionId,
                { includeDependencies: true, allowDraftState: false }
            );
            if (!data) {
                throw new NotFoundError();
            }

            res.send(
                Marketplace.Set.GetElementsOfCollectionVersion.responseSchema.encode(
                    {
                        transitive: data.transitive ?? [],
                        direct: data.direct,
                    }
                )
            );
        }
    );

    router.delete('/:setEntityId/entity', async (req, res) => {
        const setEntityId = req.params.setEntityId;
        if (!isCollectionEntityId(setEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }
        await collectionService.deleteCollection(setEntityId);
        res.sendStatus(204);
    });

    router.put('/:setEntityId/element/:elementEntityId', async (req, res) => {
        const { elementEntityId } = req.params;
        if (!isElementEntityId(elementEntityId)) {
            throw new Error('Invalid exercise element object entity id');
        }

        const parsedBody = Marketplace.Element.Edit.requestSchema.parse(
            req.body
        );

        const data = await collectionService.updateElement(
            elementEntityId,
            parsedBody.data,
            parsedBody.conflictResolution
        );

        if (!data) {
            throw new Error('Failed to update exercise element object');
        }

        res.send(
            Marketplace.Element.Edit.responseSchema.encode({
                newSetVersionId: data.newSetVersionId,
                result: data.newElement,
            })
        );
    });

    router.post(
        '/:collectionEntityId/element/:elementEntityId/version/:elementVersionId/duplicate',
        async (req, res) => {
            const { elementVersionId, collectionEntityId } = req.params;
            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid exercise element set entity id');
            }
            if (!isElementVersionId(elementVersionId)) {
                throw new Error('Invalid exercise element object entity id');
            }

            const data = await collectionService.duplicateElementVersion(
                elementVersionId,
                collectionEntityId
            );

            if (!data) {
                throw new Error('Failed to duplicate exercise element object');
            }

            res.send(
                Marketplace.Element.Duplicate.responseSchema.encode({
                    newSetVersionId: data.draftState.versionId,
                    result: data.duplicatedElement,
                })
            );
        }
    );

    router.get(
        '/:collectionEntityId/version/:collectionVersionId/element/:elementEntityId/version/:elementVersionId/internaldependencies',
        async (req, res) => {
            const { elementVersionId, elementEntityId, collectionVersionId } =
                req.params;
            if (!isElementVersionId(elementVersionId)) {
                throw new Error('Invalid exercise element set entity id');
            }
            if (!isElementEntityId(elementEntityId)) {
                throw new Error('Invalid exercise element object entity id');
            }
            if (!isCollectionVersionId(collectionVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const data = await collectionService.getDependingElements(
                {
                    entityId: elementEntityId,
                    versionId: elementVersionId,
                },
                collectionVersionId
            );

            if (!data) {
                throw new Error('Failed to duplicate exercise element object');
            }

            res.send(
                Marketplace.Element.GetInternalDependencies.responseSchema.encode(
                    {
                        result: data,
                    }
                )
            );
        }
    );

    router.delete(
        '/:setEntityId/element/:elementEntityId',
        async (req, res) => {
            const { setEntityId, elementEntityId } = req.params;
            if (!isElementEntityId(elementEntityId)) {
                throw new Error('Invalid exercise element object entity id');
            }
            if (!isCollectionEntityId(setEntityId)) {
                throw new Error('Invalid exercise element set entity id');
            }

            const deletionResult =
                await collectionService.deleteElementFromCollection(
                    elementEntityId
                );
            return res.send(
                Marketplace.Element.Delete.responseSchema.encode({
                    newSetVersionId: deletionResult.newSetVersionId,
                    requiresConfirmation: deletionResult.requiresConfirmation,
                })
            );
        }
    );

    router.get(
        '/:collectionEntityId/element/:elementEntityId/versions',
        async (req, res) => {
            const { collectionEntityId, elementEntityId } = req.params;

            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid collection entity id');
            }

            if (!isElementEntityId(elementEntityId)) {
                throw new Error('Invalid element entity id');
            }

            console.log(
                `Getting versions for element ${elementEntityId} in collection ${collectionEntityId}`
            );

            const data =
                await collectionService.getExerciseElementObjectVersions(
                    elementEntityId
                );

            return res.send(
                Marketplace.Element.GetByEntityId.responseSchema.encode({
                    result: data,
                })
            );
        }
    );

    return router;
}
