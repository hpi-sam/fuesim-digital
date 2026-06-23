import type {
    Request as ExpressRequest,
    Response as ExpressResponse,
    NextFunction,
} from 'express';
import { Router } from 'express';
import type {
    CollectionRelationshipType,
    ExtendedCollectionVersion,
} from 'fuesim-digital-shared';
import {
    checkCollectionRole,
    isCollectionEntityId,
    isCollectionVersionId,
    isElementEntityId,
    isElementVersionId,
    Marketplace,
    cloneDeepMutable,
} from 'fuesim-digital-shared';
import { z } from 'zod';
import { isAuthenticatedMiddleware } from '../utils/http-handlers.js';
import { NotFoundError, PermissionDeniedError } from '../utils/http.js';
import type { CollectionService } from '../database/services/collection-service.js';
import { Config } from '../config.js';

export function createCollectionsRouter(collectionService: CollectionService) {
    const publicRouter = Router();
    publicRouter.get('/enabled', async (req, res) => {
        res.send(!Config.experimentalDisableVersioning);
    });

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

    const createRoleMiddleware =
        (lowestAllowedRole: CollectionRelationshipType) =>
        async (
            req: ExpressRequest,
            res: ExpressResponse,
            next: NextFunction
        ) => {
            const collectionEntityId = getCollectionEntityId(req);

            const collection = await collectionService.getLatestCollectionById(
                collectionEntityId,
                { draftState: true }
            );

            if (!collection) {
                res.status(404).send({ error: 'Collection not found' });
                return;
            }

            const generallyAllowedVisibility = ['public', 'embedded'];

            if (generallyAllowedVisibility.includes(collection.visibility)) {
                next();
                return;
            }

            // We are not using the middleware here before,
            // because we want to allow access to PUBLIC/EMBEDDED collection
            // for users who are not logged in
            if (!req.session) {
                throw new PermissionDeniedError();
            }

            const userId = req.session.user.id;
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
        };

    const adminAccess = createRoleMiddleware('admin');
    const editorAccess = createRoleMiddleware('editor');
    const viewerAccess = createRoleMiddleware('viewer');
    const otherAccess = createRoleMiddleware('other');

    publicRouter.get('/my', isAuthenticatedMiddleware, async (req, res) => {
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

    publicRouter.get(
        '/my/archive',
        isAuthenticatedMiddleware,
        async (req, res) => {
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
        }
    );

    publicRouter.get('/public', async (req, res) => {
        const result = await collectionService.getLatestPublicCollections();

        return res.send(
            Marketplace.Collection.LoadPublic.responseSchema.encode({
                result,
            })
        );
    });

    publicRouter.get('/usable', async (req, res) => {
        let collections: ExtendedCollectionVersion[] = [];
        if (req.session) {
            collections = await collectionService.getLatestUsableCollections(
                req.session.user.id
            );
        } else {
            collections = await collectionService.getLatestPublicCollections();
        }

        return res.send(
            Marketplace.Collection.LoadUsable.responseSchema.encode({
                result: collections,
            })
        );
    });

    publicRouter.post(
        '/join/:joinCode',
        isAuthenticatedMiddleware,
        async (req, res) => {
            const { joinCode } = req.params;

            const result = await collectionService.joinCollectionByCode(
                z.string().parse(joinCode),
                req.session!.user.id
            );

            res.send(
                Marketplace.Collection.JoinByJoinCode.responseSchema.encode({
                    result,
                })
            );
        }
    );

    publicRouter.get(
        '/join/:joinCode/preview',
        isAuthenticatedMiddleware,
        async (req, res) => {
            const { joinCode } = req.params;
            const result = await collectionService.getCollectionByJoinCode(
                z.string().parse(joinCode)
            );
            res.send(
                Marketplace.Collection.GetPreviewByJoinCode.responseSchema.encode(
                    {
                        result,
                    }
                )
            );
        }
    );

    /*
     * Creates a new Collection
     */
    publicRouter.post(
        '/create',
        isAuthenticatedMiddleware,
        async (req, res) => {
            const parsedBody =
                Marketplace.Collection.Create.requestSchema.parse(req.body);

            const result = await collectionService.createCollection(
                parsedBody.title,
                req.session!.user.id
            );

            return res.send(
                Marketplace.Collection.Create.responseSchema.encode({
                    result,
                })
            );
        }
    );

    /*
     * Get the metadata of the latest version of the collection
     */
    publicRouter.get('/:collectionEntityId', otherAccess, async (req, res) => {
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
    publicRouter.patch(
        '/:collectionEntityId',
        adminAccess,
        async (req, res) => {
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
        }
    );

    /*
     * Create a new Collection-Element in the Collection
     */
    publicRouter.post(
        '/:collectionEntityId/create',
        editorAccess,
        async (req, res) => {
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
                    result: cloneDeepMutable(data.results),
                })
            );
        }
    );

    publicRouter.get(
        '/:collectionEntityId/invitecode',
        adminAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            const inviteCode =
                await collectionService.getCollectionInviteCode(
                    collectionEntityId
                );

            res.send(
                Marketplace.Collection.GetInviteCode.responseSchema.encode({
                    result: inviteCode,
                })
            );
        }
    );

    publicRouter.put(
        '/:collectionEntityId/invitecode',
        adminAccess,
        async (req, res) => {
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
        }
    );

    publicRouter.delete(
        '/:collectionEntityId/invitecode',
        adminAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            await collectionService.revokeCollectionInviteCode(
                collectionEntityId
            );

            res.send(
                Marketplace.Collection.DeleteInviteCode.responseSchema.encode({
                    status: 'success',
                })
            );
        }
    );

    publicRouter.get(
        '/:collectionEntityId/user-role',
        isAuthenticatedMiddleware,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            const role =
                await collectionService.getUserRoleInCollectionTransitive(
                    collectionEntityId,
                    req.session!.user.id
                );

            res.send(
                Marketplace.Collection.GetCollectionRole.responseSchema.encode({
                    result: role,
                })
            );
        }
    );

    publicRouter.get(
        '/:collectionEntityId/members',
        adminAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            const data =
                await collectionService.getCollectionMembers(
                    collectionEntityId
                );

            res.send(
                Marketplace.Collection.GetCollectionMembers.responseSchema.encode(
                    {
                        result: data,
                    }
                )
            );
        }
    );

    publicRouter.patch(
        '/:collectionEntityId/members',
        adminAccess,
        async (req, res) => {
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
        }
    );

    // This endpoint is seperate from the delete members endpoint,
    // as it has a different permission requirement and to
    // make the permissions clearer.
    publicRouter.post(
        '/:collectionEntityId/members/leave',
        viewerAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            await collectionService.removeCollectionMember(
                collectionEntityId,
                req.session!.user.id
            );

            res.send();
        }
    );

    publicRouter.delete(
        '/:collectionEntityId/members',
        adminAccess,
        async (req, res) => {
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
        }
    );

    /**
     * Add a new Dependency to a collection
     */
    publicRouter.post(
        '/:collectionEntityId/dependencies/:importSetVersionId',
        editorAccess,
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
                        elements: cloneDeepMutable(data.elements),
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
    publicRouter.post(
        '/:collectionEntityId/dependencies/:importSetVersionId/upgrade',
        editorAccess,
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
    publicRouter.delete(
        '/:collectionEntityId/dependencies/:importSetVersionId',
        editorAccess,
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
                        blockingElements: cloneDeepMutable(
                            result.blockingElements
                        ),
                        newCollectionVersionId:
                            result.newCollection?.versionId ?? null,
                    },
                })
            );
        }
    );

    publicRouter.get(
        '/:collectionEntityId/latest',
        otherAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            const data =
                await collectionService.getLatestDraftElementsOfCollection(
                    collectionEntityId
                );

            res.send(
                Marketplace.Collection.GetLatestElementsBySetVersionId.responseSchema.encode(
                    cloneDeepMutable(data)
                )
            );
        }
    );

    /* Saves the current draft state as a new version of the collection.
     */
    publicRouter.post(
        '/:collectionEntityId/draft',
        adminAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            let newCollectionState:
                | Awaited<ReturnType<typeof collectionService.saveDraftState>>
                | undefined;
            try {
                newCollectionState =
                    await collectionService.saveDraftState(collectionEntityId);
            } catch {
                res.send(
                    Marketplace.Collection.SaveDraftState.responseSchema.encode(
                        {
                            result: null,
                            saved: false,
                        }
                    )
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
        }
    );

    /*
     * Discards the current draft state and resets it to the latest published version.
     */
    publicRouter.delete(
        '/:collectionEntityId/draft',
        editorAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);

            let newCollectionState:
                | Awaited<ReturnType<typeof collectionService.revertDraftState>>
                | undefined;

            try {
                newCollectionState =
                    await collectionService.revertDraftState(
                        collectionEntityId
                    );
            } catch {
                res.send(
                    Marketplace.Collection.DeleteDraftState.responseSchema.encode(
                        {
                            result: null,
                            reverted: false,
                        }
                    )
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
        }
    );

    publicRouter.post(
        '/:collectionEntityId/change-visibility',
        adminAccess,
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

    publicRouter.post(
        '/:collectionEntityId/version/:collectionVersionId/duplicate',
        otherAccess,
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

    publicRouter.get(
        '/:collectionEntityId/version/:collectionVersionId',
        otherAccess,
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

    publicRouter.get(
        '/:collectionEntityId/version/:collectionVersionId/elements',
        otherAccess,
        async (req, res) => {
            const collectionVersionId = getCollectionVersionId(req);

            const data = await collectionService.getElementsOfCollectionVersion(
                collectionVersionId,
                { allowDraftState: false }
            );

            res.send(
                Marketplace.Collection.GetElementsOfCollectionVersion.responseSchema.encode(
                    cloneDeepMutable(data)
                )
            );
        }
    );

    publicRouter.post(
        '/:collectionEntityId/archive',
        adminAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            await collectionService.archiveCollection(collectionEntityId);
            res.sendStatus(204);
        }
    );

    publicRouter.post(
        '/:collectionEntityId/unarchive',
        adminAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            await collectionService.archiveCollection(collectionEntityId, true);
            res.sendStatus(204);
        }
    );

    publicRouter.put(
        '/:collectionEntityId/element/:elementEntityId',
        editorAccess,
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
                    result: cloneDeepMutable(data.newElement),
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
    publicRouter.post(
        '/:collectionEntityId/element/:elementEntityId/version/:elementVersionId/restore',
        editorAccess,
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
                    result: cloneDeepMutable(data.restoredElement),
                })
            );
        }
    );

    publicRouter.post(
        '/:collectionEntityId/element/:elementEntityId/version/:elementVersionId/duplicate',
        editorAccess,
        async (req, res) => {
            const collectionEntityId = getCollectionEntityId(req);
            const elementVersionId = getElementVersionId(req);

            const body = Marketplace.Element.Duplicate.requestSchema.parse(
                req.body
            );

            const data = await collectionService.duplicateElementVersion(
                elementVersionId,
                body.externalCollection ?? collectionEntityId,
                body.externalCollection !== undefined
            );

            res.send(
                Marketplace.Element.Duplicate.responseSchema.encode({
                    newSetVersionId: data.draftState.versionId,
                    result: cloneDeepMutable(data.duplicatedElement),
                })
            );
        }
    );

    publicRouter.get(
        '/:collectionEntityId/version/:collectionVersionId/element/:elementEntityId/version/:elementVersionId/internaldependencies',
        otherAccess,
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
                        result: cloneDeepMutable(data),
                    }
                )
            );
        }
    );

    publicRouter.delete(
        '/:collectionEntityId/element/:elementEntityId',
        editorAccess,
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
                    requiresConfirmation: cloneDeepMutable(
                        deletionResult.requiresConfirmation
                    ),
                })
            );
        }
    );

    publicRouter.get(
        '/:collectionEntityId/element/:elementEntityId/versions',
        otherAccess,
        async (req, res) => {
            const elementEntityId = getElementEntityId(req);

            const data =
                await collectionService.getExerciseElementObjectVersions(
                    elementEntityId
                );

            return res.send(
                Marketplace.Element.GetByEntityId.responseSchema.encode({
                    result: cloneDeepMutable(data),
                })
            );
        }
    );

    return publicRouter;
}
