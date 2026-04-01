import { Router } from 'express';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import {
    checkCollectionRole,
    CollectionRelationshipType,
    isCollectionEntityId,
    isCollectionVersionId,
    isElementEntityId,
    isElementVersionId,
    Marketplace,
} from 'fuesim-digital-shared';
import { NotFoundError } from '../utils/http.js';
import { CollectionService } from '../database/services/collection-service.js';
import { CollectionEventSender } from '../collections/collection-event-sender.js';
import { Config } from '../config.js';

export function createCollectionsRouter(collectionService: CollectionService) {
    const router = Router();

    const createRoleRouter = (
        lowestAllowedRole: CollectionRelationshipType
    ) => {
        const router = Router({ mergeParams: true });
        router.use('/:collectionEntityId', async (req, res, next) => {
            const collectionEntityId = req.params['collectionEntityId'] ?? '';
            if (!isCollectionEntityId(collectionEntityId)) {
                res.status(400).send({ error: 'Invalid collection id' });
                return;
            }

            const collection = await collectionService.getLatestCollectionById(
                collectionEntityId,
                { draftState: true }
            );

            if (!collection) {
                res.status(404).send({ error: 'Collection not found' });
                return;
            }

            const userId = req.session!.user.id;
            const relationship =
                await collectionService.getUserRoleInCollection(
                    collectionEntityId,
                    userId
                );

            if (!relationship) {
                res.status(403).send({
                    error: 'You do not have access to this collection',
                });
                return;
            }

            const rolecheck =
                checkCollectionRole(relationship).isAtLeast(lowestAllowedRole);
            if (!rolecheck) {
                res.status(403).send({
                    error: 'You do not have the required permissions to perform this action',
                });
                return;
            }
            next();
        });

        return router;
    };

    const adminRouter = createRoleRouter('admin');
    const editorRouter = createRoleRouter('editor');
    const viewerRouter = createRoleRouter('viewer');

    router.use((req, res, next) => {
        console.debug(
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

    router.get('/join/:joinCode', async (req, res) => {
        const { joinCode } = req.params;
        try {
            const result = await collectionService.joinCollectionByCode(
                joinCode,
                req.session!.user.id
            );
            res.redirect(Config.httpFrontendUrl + `/collections/${result}`);
            return;
        } catch (err) {
            console.error(
                `[CollectionsRouter] Failed to join collection with code ${joinCode} for user ${req.session!.user.id}`,
                err
            );
        }
        res.redirect(Config.httpFrontendUrl + `/collections`);
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

    /*
     * Get the metadata of the latest version of the collection
     */
    viewerRouter.get('/:collectionEntityId', async (req, res) => {
        const collectionEntityId = req.params.collectionEntityId;
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

    adminRouter.patch('/:collectionEntityId', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const parsedBody = Marketplace.Set.Edit.requestSchema.parse(req.body);

        const result = await collectionService.updateCollectionMetadata(
            collectionEntityId,
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
    editorRouter.post('/:collectionEntityId/create', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const parsedBody = Marketplace.Element.Create.requestSchema.parse(
            req.body
        );

        const data = await collectionService.createExerciseObject(
            collectionEntityId,
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

    adminRouter.get('/:collectionEntityId/invitecode', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const inviteCode =
            await collectionService.getCollectionInviteCode(collectionEntityId);

        res.send(
            Marketplace.Set.GetInviteCode.responseSchema.encode({
                result: inviteCode,
            })
        );
    });

    adminRouter.put('/:collectionEntityId/invitecode', async (req, res) => {
        //TODO: Restrict this endpoint to only admins
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const inviteCode =
            await collectionService.getOrCreateCollectionInviteCode(
                collectionEntityId
            );

        res.send(
            Marketplace.Set.PutInviteCode.responseSchema.encode({
                result: inviteCode,
            })
        );
    });

    adminRouter.get('/:collectionEntityId/members', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const data =
            await collectionService.getCollectionMembers(collectionEntityId);

        res.send(
            Marketplace.Set.GetCollectionMembers.responseSchema.encode({
                result: data,
            })
        );
    });

    adminRouter.patch('/:collectionEntityId/members', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const parsedBody =
            Marketplace.Set.PatchCollectionMember.requestSchema.parse(req.body);

        await collectionService.setCollectionMemberRole(
            collectionEntityId,
            parsedBody.userId,
            parsedBody.role
        );

        res.send();
    });

    adminRouter.delete('/:collectionEntityId/members', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        const parsedBody =
            Marketplace.Set.DeleteCollectionMember.requestSchema.parse(
                req.body
            );

        await collectionService.removeCollectionMember(
            collectionEntityId,
            parsedBody.userId
        );

        res.send();
    });

    editorRouter.post(
        '/:collectionEntityId/dependencies/:importSetVersionId',
        async (req, res) => {
            const { collectionEntityId, importSetVersionId } = req.params;
            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid exercise element set version id');
            }
            if (!isCollectionVersionId(importSetVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const data = await collectionService.addCollectionDependency(
                {
                    importTo: collectionEntityId,
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

    editorRouter.delete(
        '/:collectionEntityId/dependencies/:importSetVersionId',
        async (req, res) => {
            const { collectionEntityId, importSetVersionId } = req.params;
            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid exercise element set version id');
            }
            if (!isCollectionVersionId(importSetVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            await collectionService.removeCollectionDependency({
                removeFrom: collectionEntityId,
                dependencyEntityId: importSetVersionId,
            });

            res.send({ status: 'success' });
        }
    );

    viewerRouter.get('/:collectionEntityId/latest', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set entity id');
        }

        const data = await collectionService.getLatestDraftElementsOfCollection(
            collectionEntityId,
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

    viewerRouter.get('/:collectionEntityId/events', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set entity id');
        }

        new CollectionEventSender(
            req,
            res,
            collectionEntityId,
            collectionService,
            req.session!.user.id
        );
    });

    editorRouter.post('/:collectionEntityId/save', async (req, res) => {
        const { collectionEntityId } = req.params;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }

        let newCollectionState:
            | Awaited<ReturnType<typeof collectionService.saveDraftState>>
            | undefined;
        try {
            newCollectionState =
                await collectionService.saveDraftState(collectionEntityId);
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

    adminRouter.post(
        '/:collectionEntityId/change-visibility',
        async (req, res) => {
            const { collectionEntityId } = req.params;

            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid exercise element set entity id');
            }

            const data =
                await collectionService.makeCollectionPublic(
                    collectionEntityId
                );

            res.send(
                Marketplace.Set.ChangeVisibility.responseSchema.encode({
                    status: 'success',
                })
            );
        }
    );

    viewerRouter.post(
        '/:collectionEntityId/version/:collectionVersionId/duplicate',
        async (req, res) => {
            const { collectionVersionId } = req.params;
            if (!isCollectionVersionId(collectionVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const createdSet =
                await collectionService.duplicateCollectionVersion(
                    collectionVersionId,
                    req.session!.user.id
                );

            res.send(
                Marketplace.Set.Duplicate.responseSchema.encode({
                    createdSet,
                })
            );
        }
    );

    viewerRouter.get(
        '/:collectionEntityId/version/:collectionVersionId',
        async (req, res) => {
            const { collectionEntityId, collectionVersionId } = req.params;
            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid exercise element set entity id');
            }
            if (!isCollectionVersionId(collectionVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const collection =
                await collectionService.getCollectionVersionById(
                    collectionVersionId
                );
            if (!collection) {
                throw new NotFoundError();
            }

            res.send(
                Marketplace.Set.GetCollectionVersion.responseSchema.encode({
                    result: collection,
                })
            );
        }
    );

    viewerRouter.get(
        '/:collectionEntityId/version/:collectionVersionId/elements',
        async (req, res) => {
            const { collectionEntityId, collectionVersionId } = req.params;
            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid exercise element set entity id');
            }
            if (!isCollectionVersionId(collectionVersionId)) {
                throw new Error('Invalid exercise element set version id');
            }

            const data = await collectionService.getElementsOfCollectionVersion(
                collectionVersionId,
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

    adminRouter.delete('/:collectionEntityId/entity', async (req, res) => {
        const collectionEntityId = req.params.collectionEntityId;
        if (!isCollectionEntityId(collectionEntityId)) {
            throw new Error('Invalid exercise element set version id');
        }
        await collectionService.deleteCollection(collectionEntityId);
        res.sendStatus(204);
    });

    editorRouter.put(
        '/:collectionEntityId/element/:elementEntityId',
        async (req, res) => {
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
        }
    );

    editorRouter.post(
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

    viewerRouter.get(
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

    editorRouter.delete(
        '/:collectionEntityId/element/:elementEntityId',
        async (req, res) => {
            const { collectionEntityId, elementEntityId } = req.params;
            if (!isElementEntityId(elementEntityId)) {
                throw new Error('Invalid exercise element object entity id');
            }
            if (!isCollectionEntityId(collectionEntityId)) {
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

    viewerRouter.get(
        '/:collectionEntityId/element/:elementEntityId/versions',
        async (req, res) => {
            const { collectionEntityId, elementEntityId } = req.params;

            if (!isCollectionEntityId(collectionEntityId)) {
                throw new Error('Invalid collection entity id');
            }

            if (!isElementEntityId(elementEntityId)) {
                throw new Error('Invalid element entity id');
            }

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

    router.use(viewerRouter);
    router.use(editorRouter);
    router.use(adminRouter);

    return router;
}
