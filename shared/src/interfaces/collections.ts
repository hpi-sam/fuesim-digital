import { z } from 'zod';
import type { Immutable } from 'immer';
import type { ImmutableInfer } from '../utils/infer.js';
import type { CollectionEntityId } from '../marketplace/models/versioned-id-schema.js';
import {
    collectionEntityIdSchema,
    collectionVersionIdSchema,
    elementEntityIdSchema,
    elementVersionIdSchema,
} from '../marketplace/models/versioned-id-schema.js';
import { collectionRelationshipTypeSchema } from '../marketplace/models/collection-relationship.js';
import {
    collectionVersionSchema,
    extendedCollectionVersionSchema,
} from '../marketplace/models/collection.js';
import {
    collectionElementsSchema,
    collectionElementsSingleSchema,
} from '../marketplace/models/collection-elements.js';
import { collectionVisibilitySchema } from '../marketplace/models/collection-visibility.js';
import { templateVersionSchema } from '../marketplace/models/versioned-elements.js';
import { versionedElementContentSchema } from '../marketplace/models/versioned-element-content.js';
import { organisationIdSchema } from '../ids.js';
import { stringToDate } from './utils.js';

class Route<TRequest = never, TResponse = never> {
    constructor(opts: { request?: TRequest; response?: TResponse }) {
        this.requestSchema = opts.request as TRequest;
        this.responseSchema = opts.response as TResponse;
    }

    public readonly requestSchema: TRequest;
    public readonly responseSchema: TResponse;
    public readonly Request!: TRequest extends z.ZodType
        ? ImmutableInfer<TRequest>
        : never;
    public readonly Response!: TResponse extends z.ZodType
        ? ImmutableInfer<TResponse>
        : never;
}

/* eslint-disable @typescript-eslint/naming-convention */
export namespace Marketplace {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    export namespace Element {
        export const Create = new Route({
            request: z.object({
                data: z.array(versionedElementContentSchema),
            }),
            response: z.object({
                newSetVersionId: collectionVersionIdSchema,
                result: z.array(templateVersionSchema),
            }),
        });

        export const Import = new Route({
            request: z.object({
                objects: z.array(templateVersionSchema),
            }),
            response: z.object({
                newSetVersionId: collectionVersionIdSchema,
                result: z.array(templateVersionSchema),
            }),
        });

        export const editConflictResolutionSchema = z.object({
            // This is used to check server-side if the user is aware of all changes,
            // or if there are new changes that they should be aware of before saving their changes
            affectingElementIds: z.array(elementVersionIdSchema),
            strategy: z.enum(['createCopy', 'cascadeChanges']),
        });

        export type EditConflictResolution = z.infer<
            typeof editConflictResolutionSchema
        >;

        export const Edit = new Route({
            request: z.object({
                data: versionedElementContentSchema,
                conflictResolution: editConflictResolutionSchema.optional(),
            }),
            response: z.object({
                newSetVersionId: collectionVersionIdSchema,
                result: templateVersionSchema,
            }),
        });

        export const Restore = new Route({
            response: z.object({
                newCollectionVersionId: collectionVersionIdSchema,
                result: templateVersionSchema,
            }),
        });

        export const Duplicate = new Route({
            request: z.object({
                externalCollection: collectionEntityIdSchema.optional(),
            }),
            response: z.object({
                newSetVersionId: collectionVersionIdSchema,
                result: templateVersionSchema,
            }),
        });

        export const Delete = new Route({
            request: z.object({
                conflictResolution: z
                    .object({
                        acceptedCascadingDeletions: z
                            .array(elementVersionIdSchema)
                            .optional(),
                    })
                    .optional(),
            }),
            response: z.object({
                newSetVersionId: collectionVersionIdSchema.nullable(),
                requiresConfirmation: z.array(templateVersionSchema),
            }),
        });

        export const GetByEntityId = new Route({
            response: z.object({
                result: z.array(templateVersionSchema),
            }),
        });

        export const GetInternalDependencies = new Route({
            response: z.object({
                result: z.array(templateVersionSchema),
            }),
        });
    }

    export namespace Collection {
        export const inviteCodeSchema = z.object({
            code: z.string(),
            expiresAt: stringToDate,
            collection: collectionEntityIdSchema,
        });

        export const Create = new Route({
            request: z.object({
                title: z.string().trim().nonempty(),
                organisationId: organisationIdSchema,
            }),
            response: z.object({
                result: collectionVersionSchema,
            }),
        });

        export const GetCollectionRole = new Route({
            response: z.object({
                result: collectionRelationshipTypeSchema.nullable(),
            }),
        });

        export const JoinByJoinCode = new Route({
            response: z.object({
                result: collectionEntityIdSchema,
            }),
        });

        export const GetPreviewByJoinCode = new Route({
            response: z.object({
                result: collectionVersionSchema,
            }),
        });

        export const GetCollectionOrganisations = new Route({
            response: z.object({
                result: z.array(
                    z.object({
                        id: z.string(),
                        name: z.string(),
                        owner: z.boolean(),
                    })
                ),
            }),
        });

        export const PatchCollectionMember = new Route({
            request: z.object({
                userId: z.string(),
                role: collectionRelationshipTypeSchema,
            }),
        });

        export const DeleteCollectionMember = new Route({
            request: z.object({
                userId: z.string(),
            }),
        });

        export const GetInviteCode = new Route({
            response: z.object({
                result: inviteCodeSchema.nullable(),
            }),
        });

        export const PutInviteCode = new Route({
            response: z.object({
                result: inviteCodeSchema,
            }),
        });

        export const DeleteInviteCode = new Route({
            response: z.object({
                status: z.literal(['success']),
            }),
        });

        export const editableCollectionPropertiesSchema = z.object({
            title: z.string().trim().nonempty().optional(),
            description: z.string().trim().nonempty().optional(),
        });

        export type EditableCollectionProperties = ImmutableInfer<
            typeof editableCollectionPropertiesSchema
        >;

        export const Edit = new Route({
            request: editableCollectionPropertiesSchema,
            response: z.object({
                result: collectionVersionSchema,
            }),
        });

        export const LoadMy = new Route({
            response: z.object({
                result: z.array(extendedCollectionVersionSchema),
            }),
        });

        export const LoadPublic = new Route({
            response: z.object({
                result: z.array(extendedCollectionVersionSchema),
            }),
        });

        export const LoadUsable = new Route({
            response: z.object({
                result: z.array(extendedCollectionVersionSchema),
            }),
        });

        export const GetByEntityId = new Route({
            response: z.object({
                result: collectionVersionSchema,
            }),
        });

        export const GetLatestElementsBySetVersionId = new Route({
            response: collectionElementsSchema,
        });

        export const GetCollectionVersion = new Route({
            response: z.object({
                result: collectionVersionSchema,
            }),
        });

        export const AddDependency = new Route({
            response: z.object({
                importedSet: collectionElementsSingleSchema,
                newCollectionVersionId: collectionVersionIdSchema,
            }),
        });

        export const UpgradeDependency = new Route({
            request: z.object({
                acceptedElementChanges: z.array(elementVersionIdSchema),
            }),
            response: z.object({
                newCollectionVersionId: collectionVersionIdSchema,
            }),
        });

        export const RemoveDependency = new Route({
            response: z.object({
                result: z.union([
                    z.object({
                        newCollectionVersionId:
                            collectionVersionIdSchema.nullable(),
                        blockingElements: z.array(templateVersionSchema),
                    }),
                ]),
            }),
        });

        export const ChangeVisibility = new Route({
            request: z.object({
                visibility: collectionVisibilitySchema,
            }),
            response: z.object({
                status: z.literal(['success']),
            }),
        });

        export const Duplicate = new Route({
            request: z.object({
                targetOrganisationId: organisationIdSchema,
            }),
            response: z.object({
                createdSet: collectionVersionSchema,
            }),
        });

        export const SaveDraftState = new Route({
            response: z.object({
                result: collectionVersionSchema.nullable(),
                saved: z.boolean().default(true),
            }),
        });

        export const DeleteDraftState = new Route({
            response: z.object({
                result: collectionVersionSchema.nullable(),
                reverted: z.boolean().default(true),
            }),
        });

        export const GetElementsOfCollectionVersion = new Route({
            response: collectionElementsSchema,
        });

        class TypedSchema<D, T> {
            constructor(public readonly schema: T) {}

            public readonly Type!: T extends z.ZodType
                ? // if D is defined (override type), use D, otherwise infer from T
                  D extends unknown
                    ? ImmutableInfer<T>
                    : D
                : never;

            public readonly InputType!: T extends z.ZodType
                ? Immutable<z.input<T>>
                : never;
        }

        export namespace Events {
            const defineEvent = <TName extends string, TData>(
                eventName: TName,
                dataSchema: TData
            ) => {
                const schema = z.object({
                    event: z.literal(eventName),
                    data: dataSchema,
                    collectionEntityId: collectionEntityIdSchema,
                });
                // We need to type seperately to keep the event-name as a literal type
                return new TypedSchema<
                    {
                        event: TName;
                        collectionEntityId: CollectionEntityId;
                        data: ImmutableInfer<TData>;
                    },
                    typeof schema
                >(schema);
            };

            export const DependencyChange = defineEvent(
                'dependency:change',
                collectionVersionIdSchema
            );

            export const DependencyReplaceData = defineEvent(
                'dependency:replace-data',
                z.object({
                    imported: z.array(collectionElementsSingleSchema),
                    references: z.array(collectionElementsSingleSchema),
                })
            );

            export const InitialData = defineEvent(
                'initialdata',
                z.object({
                    collection: collectionVersionSchema,
                    elements: collectionElementsSchema,
                    publishedCollection: collectionVersionSchema,
                    publishedElements: collectionElementsSchema,
                    userRelationship: collectionRelationshipTypeSchema,
                })
            );

            export const ElementCreate = defineEvent(
                'element:create',
                templateVersionSchema
            );

            export const ElementUpdate = defineEvent(
                'element:update',
                templateVersionSchema
            );

            export const ElementDelete = defineEvent(
                'element:delete',
                z.object({
                    entityId: elementEntityIdSchema,
                })
            );

            export const CollectionUpdate = defineEvent(
                'collection:update',
                collectionVersionSchema
            );

            export const CollectionRefreshData = defineEvent(
                'collection:refresh-data',
                z.object({
                    draftElements: collectionElementsSchema.optional(),
                    publishedElements: collectionElementsSchema.optional(),
                    draftCollection: collectionVersionSchema.optional(),
                    publishedCollection: collectionVersionSchema.optional(),
                })
            );

            export const SSEvent = new TypedSchema(
                z.discriminatedUnion('event', [
                    CollectionRefreshData.schema,
                    CollectionUpdate.schema,
                    DependencyChange.schema,
                    DependencyReplaceData.schema,
                    ElementCreate.schema,
                    ElementDelete.schema,
                    ElementUpdate.schema,
                    InitialData.schema,
                ])
            );
        }
    }
}

/* eslint-enable @typescript-eslint/naming-convention */
