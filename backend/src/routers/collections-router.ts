import type { Request as ExpressRequest } from 'express';
import { Router } from 'express';
import type { CollectionRelationshipType } from 'fuesim-digital-shared';
import {
    checkCollectionRole,
    isCollectionEntityId,
    isCollectionVersionId,
    isElementEntityId,
    isElementVersionId,
    Marketplace,
} from 'fuesim-digital-shared';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import { NotFoundError } from '../utils/http.js';
import type { CollectionService } from '../database/services/collection-service.js';

export function createCollectionsRouter(collectionService: CollectionService) {
    const router = Router();
    router.use(isAuthenticatedMiddleware);

    const reqParamValidator =
        <U extends string & {}>(
            validator: (value: string) => value is U,
            paramName: string
        ) =>
        (req: ExpressRequest, named?: string): U => {
            const collectionEntityId = req.params[named ?? paramName] ?? '';
            if (!validator(collectionEntityId)) {
                throw new Error(`Invalid ${paramName}`);
            }
            return collectionEntityId;
        };

    const getCollectionEntityId = reqParamValidator(
        isCollectionEntityId,
        'collectionEntityId'
    );
    const getCollectionVersionId = reqParamValidator(
        isCollectionVersionId,
        'collectionVersionId'
    );
    const getElementEntityId = reqParamValidator(
        isElementEntityId,
        'elementEntityId'
    );
    const getElementVersionId = reqParamValidator(
        isElementVersionId,
        'elementVersionId'
    );

    const createRoleRouter = (
        lowestAllowedRole: CollectionRelationshipType
    ) => {
        const roleRouter = Router({ mergeParams: false });
        roleRouter.use('/:collectionEntityId', async (req, res, next) => {
            const collectionEntityId = getCollectionEntityId(req);

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
                await collectionService.getUserRoleInCollectionTransitive(
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

        return roleRouter;
    };

    const adminRouter = createRoleRouter('admin');
    const editorRouter = createRoleRouter('editor');
    const viewerRouter = createRoleRouter('viewer');

    router.get('/my', async (req, res) => {
        const includeDraftState = req.query['includeDraftState'] === 'true';
        const archived = req.query['archived'] === 'true';

        const result = await collectionService.getLatestCollectionsForUser(
            req.session!.user.id,
            { includeDraftState, archived }
        );

        return res.send(
            Marketplace.Collection.LoadMy.responseSchema.encode({
                result,
            })
        );
    });

    router.get('/my/archive', async (req, res) => {
        const includeDraftState = req.query['includeDraftState'] === 'true';

        const result = await collectionService.getLatestCollectionsForUser(
            req.session!.user.id,
            { includeDraftState }
        );

        return res.send(
            Marketplace.Collection.LoadMy.responseSchema.encode({
                result,
            })
        );
    });

    router.post('/join/:joinCode', async (req, res) => {
        const { joinCode } = req.params;

        const result = await collectionService.joinCollectionByCode(
            joinCode,
            req.session!.user.id
        );

        res.send(
            Marketplace.Collection.JoinByJoinCode.responseSchema.encode({
                result,
            })
        );
    });

    router.get('/join/:joinCode/preview', async (req, res) => {
        const { joinCode } = req.params;
        const result =
            await collectionService.getCollectionByJoinCode(joinCode);
        res.send(
            Marketplace.Collection.GetPreviewByJoinCode.responseSchema.encode({
                result,
            })
        );
    });

    /*
     * Creates a new Collection
     */
    router.post('/create', async (req, res) => {
        const parsedBody = Marketplace.Collection.Create.requestSchema.parse(
            req.body
        );

        const result = await collectionService.createCollection(
            parsedBody.title,
            req.session!.user.id
        );

        return res.send(
            Marketplace.Collection.Create.responseSchema.encode({
                result,
            })
        );
    });

    /*
     * Get the metadata of the latest version of the collection
     */
    viewerRouter.get('/:collectionEntityId', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const allowDraftState = req.query['allowdraftstate'] === 'true';

        const result = await collectionService.getLatestCollectionById(
            collectionEntityId,
            { draftState: allowDraftState }
        );
        if (!result) {
            throw new NotFoundError();
        }

        return res.send(
            Marketplace.Collection.GetByEntityId.responseSchema.encode({
                result,
            })
        );
    });

    /*
     * Edit Collection Metadata (e.g. title)
     */
    adminRouter.patch('/:collectionEntityId', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const parsedBody = Marketplace.Collection.Edit.requestSchema.parse(
            req.body
        );

        const result = await collectionService.updateCollectionMetadata(
            collectionEntityId,
            parsedBody
        );

        res.send(
            Marketplace.Collection.Edit.responseSchema.encode({
                result,
            })
        );
    });

    /*
     * Create a new Collection-Element in the Collection
     */
    editorRouter.post('/:collectionEntityId/create', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const parsedBody = Marketplace.Element.Create.requestSchema.parse(
            req.body
        );

        const data = await collectionService.createExerciseObjects(
            collectionEntityId,
            parsedBody.data
        );

        res.send(
            Marketplace.Element.Create.responseSchema.encode({
                newSetVersionId: data.newSetVersionId,
                result: data.results,
            })
        );
    });

    adminRouter.get('/:collectionEntityId/invitecode', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const inviteCode =
            await collectionService.getCollectionInviteCode(collectionEntityId);

        res.send(
            Marketplace.Collection.GetInviteCode.responseSchema.encode({
                result: inviteCode,
            })
        );
    });

    adminRouter.put('/:collectionEntityId/invitecode', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const inviteCode =
            await collectionService.getOrCreateCollectionInviteCode(
                collectionEntityId
            );

        res.send(
            Marketplace.Collection.PutInviteCode.responseSchema.encode({
                result: inviteCode,
            })
        );
    });

    adminRouter.delete('/:collectionEntityId/invitecode', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        await collectionService.revokeCollectionInviteCode(collectionEntityId);

        res.send(
            Marketplace.Collection.DeleteInviteCode.responseSchema.encode({
                status: 'success',
            })
        );
    });

    router.get('/:collectionEntityId/isMember', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const data =
            await collectionService.getCollectionMembers(collectionEntityId);

        res.send(
            Marketplace.Collection.GetIsMember.responseSchema.encode({
                result: data.some((s) => s.id === req.session!.user.id),
            })
        );
    });

    adminRouter.get('/:collectionEntityId/members', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const data =
            await collectionService.getCollectionMembers(collectionEntityId);

        res.send(
            Marketplace.Collection.GetCollectionMembers.responseSchema.encode({
                result: data,
            })
        );
    });

    adminRouter.patch('/:collectionEntityId/members', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const parsedBody =
            Marketplace.Collection.PatchCollectionMember.requestSchema.parse(
                req.body
            );

        await collectionService.setCollectionMemberRole(
            collectionEntityId,
            parsedBody.userId,
            parsedBody.role
        );

        res.send();
    });

    // This endpoint is seperate from the delete members endpoint,
    // as it has a different permission requirement and to
    // make the permissions clearer.
    viewerRouter.post(
        '/:collectionEntityId/members/leave',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            await collectionService.removeCollectionMember(
                collectionEntityId,
                req.session!.user.id
            );

            res.send();
        }
    );

    adminRouter.delete('/:collectionEntityId/members', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const parsedBody =
            Marketplace.Collection.DeleteCollectionMember.requestSchema.parse(
                req.body
            );

        await collectionService.removeCollectionMember(
            collectionEntityId,
            parsedBody.userId
        );

        res.send();
    });

    /**
     * Add a new Dependency to a collection
     */
    editorRouter.post(
        '/:collectionEntityId/dependencies/:importSetVersionId',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            const importSetVersionId = getCollectionVersionId(
                req,
                'importSetVersionId'
            );

            const data = await collectionService.addCollectionDependency({
                importTo: collectionEntityId,
                importFrom: importSetVersionId,
            });

            res.send(
                Marketplace.Collection.AddDependency.responseSchema.encode({
                    importedSet: {
                        collection: data.collection,
                        elements: data.elements,
                    },
                    newCollectionVersionId: data.newCollectionVersion.versionId,
                })
            );
        }
    );

    /**
     * Upgrade a Dependency of a collection
     *
     * This is seperate from the add dependency endpoint to allow for checks and resolution of internal dependencies
     */
    editorRouter.post(
        '/:collectionEntityId/dependencies/:importSetVersionId/upgrade',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            const importSetVersionId = getCollectionVersionId(
                req,
                'importSetVersionId'
            );

            const parsedBody =
                Marketplace.Collection.UpgradeDependency.requestSchema.parse(
                    req.body
                );

            const data = await collectionService.upgradeCollectionDependency({
                upgradeIn: collectionEntityId,
                upgradeTo: importSetVersionId,
                acceptedElementChanges: parsedBody.acceptedElementChanges,
            });

            res.send(
                Marketplace.Collection.UpgradeDependency.responseSchema.encode({
                    importedSet: {
                        collection: data.collection,
                        elements: data.elements,
                    },
                    newCollectionVersionId: data.newCollectionVersion.versionId,
                })
            );
        }
    );

    /*
     * Remove a collection dependency from the collection.
     */
    editorRouter.delete(
        '/:collectionEntityId/dependencies/:importSetVersionId',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            const importSetVersionId = getCollectionVersionId(
                req,
                'importSetVersionId'
            );

            const result = await collectionService.removeCollectionDependency({
                removeFrom: collectionEntityId,
                dependencyEntityId: importSetVersionId,
            });

            res.send(
                Marketplace.Collection.RemoveDependency.responseSchema.encode({
                    result: {
                        blockingElements: result.blockingElements,
                        newCollectionVersionId:
                            result.newCollection?.versionId ?? null,
                    },
                })
            );
        }
    );

    viewerRouter.get('/:collectionEntityId/latest', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        const data =
            await collectionService.getLatestDraftElementsOfCollection(
                collectionEntityId
            );

        res.send(
            Marketplace.Collection.GetLatestElementsBySetVersionId.responseSchema.encode(
                data
            )
        );
    });

    /* Saves the current draft state as a new version of the collection.
     */
    adminRouter.post('/:collectionEntityId/draft', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        let newCollectionState:
            | Awaited<ReturnType<typeof collectionService.saveDraftState>>
            | undefined;
        try {
            newCollectionState =
                await collectionService.saveDraftState(collectionEntityId);
        } catch {
            res.send(
                Marketplace.Collection.SaveDraftState.responseSchema.encode({
                    result: null,
                    saved: false,
                })
            );
        }

        if (!newCollectionState) {
            throw new Error('Failed to save exercise element set');
        }

        res.send(
            Marketplace.Collection.SaveDraftState.responseSchema.encode({
                result: newCollectionState,
                saved: true,
            })
        );
    });

    /*
     * Discards the current draft state and resets it to the latest published version.
     */
    editorRouter.delete('/:collectionEntityId/draft', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);

        let newCollectionState:
            | Awaited<ReturnType<typeof collectionService.revertDraftState>>
            | undefined;

        try {
            newCollectionState =
                await collectionService.revertDraftState(collectionEntityId);
        } catch {
            res.send(
                Marketplace.Collection.DeleteDraftState.responseSchema.encode({
                    result: null,
                    reverted: false,
                })
            );
        }

        if (!newCollectionState) {
            throw new Error('Failed to revert collection draft state');
        }

        res.send(
            Marketplace.Collection.DeleteDraftState.responseSchema.encode({
                result: newCollectionState,
                reverted: true,
            })
        );
    });

    adminRouter.post(
        '/:collectionEntityId/change-visibility',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            await collectionService.makeCollectionPublic(collectionEntityId);

            res.send(
                Marketplace.Collection.ChangeVisibility.responseSchema.encode({
                    status: 'success',
                })
            );
        }
    );

    viewerRouter.post(
        '/:collectionEntityId/version/:collectionVersionId/duplicate',
        async (req, res) => {
            const collectionVersionId = getCollectionVersionId(req);

            const createdSet =
                await collectionService.duplicateCollectionVersion(
                    collectionVersionId,
                    req.session!.user.id
                );

            res.send(
                Marketplace.Collection.Duplicate.responseSchema.encode({
                    createdSet,
                })
            );
        }
    );

    viewerRouter.get(
        '/:collectionEntityId/version/:collectionVersionId',
        async (req, res) => {
            const collectionVersionId = getCollectionVersionId(req);

            const collection =
                await collectionService.getCollectionVersionById(
                    collectionVersionId
                );
            if (!collection) {
                throw new NotFoundError();
            }

            res.send(
                Marketplace.Collection.GetCollectionVersion.responseSchema.encode(
                    {
                        result: collection,
                    }
                )
            );
        }
    );

    viewerRouter.get(
        '/:collectionEntityId/version/:collectionVersionId/elements',
        async (req, res) => {
            const collectionVersionId = getCollectionVersionId(req);

            const data = await collectionService.getElementsOfCollectionVersion(
                collectionVersionId,
                { allowDraftState: false }
            );

            res.send(
                Marketplace.Collection.GetElementsOfCollectionVersion.responseSchema.encode(
                    data
                )
            );
        }
    );

    adminRouter.post('/:collectionEntityId/archive', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);
        await collectionService.archiveCollection(collectionEntityId);
        res.sendStatus(204);
    });

    adminRouter.post('/:collectionEntityId/unarchive', async (req, res) => {
        const collectionEntityId = getCollectionEntityId(req);
        await collectionService.archiveCollection(collectionEntityId, true);
        res.sendStatus(204);
    });

    editorRouter.put(
        '/:collectionEntityId/element/:elementEntityId',
        async (req, res) => {
            const elementEntityId = getElementEntityId(req);

            const parsedBody = Marketplace.Element.Edit.requestSchema.parse(
                req.body
            );

            const data = await collectionService.updateElement(
                elementEntityId,
                parsedBody.data,
                parsedBody.conflictResolution
            );

            res.send(
                Marketplace.Element.Edit.responseSchema.encode({
                    newSetVersionId: data.newSetVersionId,
                    result: data.newElement,
                })
            );
        }
    );

    /*
     * Restores a deleted element.
     *
     * This reinstates the element with the same versionId and/or
     * reconncects mappings to to containing collection
     */
    editorRouter.post(
        '/:collectionEntityId/element/:elementEntityId/version/:elementVersionId/restore',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            const elementVersionId = getElementVersionId(req);

            const data = await collectionService.restoreDeletedElementVersion(
                collectionEntityId,
                elementVersionId
            );

            res.send(
                Marketplace.Element.Restore.responseSchema.encode({
                    newCollectionVersionId: data.newCollectionVersion.versionId,
                    result: data.restoredElement,
                })
            );
        }
    );

    editorRouter.post(
        '/:collectionEntityId/element/:elementEntityId/version/:elementVersionId/duplicate',
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            const elementVersionId = getElementVersionId(req);

            const data = await collectionService.duplicateElementVersion(
                elementVersionId,
                collectionEntityId
            );

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
            const collectionVersionId = getCollectionVersionId(req);
            const elementEntityId = getElementEntityId(req);
            const elementVersionId = getElementVersionId(req);

            const data = await collectionService.getDependingElements(
                {
                    entityId: elementEntityId,
                    versionId: elementVersionId,
                },
                collectionVersionId
            );

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
            const elementEntityId = getElementEntityId(req);
            const body = Marketplace.Element.Delete.requestSchema.parse(
                req.body
            );

            const deletionResult =
                await collectionService.deleteElementFromCollection(
                    elementEntityId,
                    body.conflictResolution?.acceptedCascadingDeletions ?? []
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
            const elementEntityId = getElementEntityId(req);

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
