import { z } from 'zod';
import { exerciseTemplateIdSchema, parallelExerciseIdSchema } from './ids.js';
import {
    groupParticipantKeySchema,
    participantKeySchema,
    trainerKeySchema,
} from './exercise-keys.js';
import { validationMessages } from './validation-messages.js';
import { exerciseStatusSchema } from './models/utils/exercise-status.js';
import { logEntrySchema } from './models/log-entry.js';
import { stringToDate } from './models/utils/date.js';
import {
    collectionDtoSchema,
    extendedCollectionDtoSchema,
} from './marketplace/models/collection.js';
import { elementDtoSchema } from './marketplace/models/versioned-elements.js';
import type { CollectionEntityId } from './marketplace/models/versioned-id-schema.js';
import {
    collectionVersionIdSchema,
    elementVersionIdSchema,
    collectionEntityIdSchema,
    elementEntityIdSchema,
} from './marketplace/models/versioned-id-schema.js';
import { collectionRelationshipTypeSchema } from './marketplace/models/collection-relationship.js';
import { versionedElementContentSchema } from './marketplace/models/versioned-element-content.js';
import {
    collectionElementsDtoSchema,
    collectionElementsSingleSchema,
} from './marketplace/models/collection-elements.js';
import { collectionVisibilitySchema } from './marketplace/models/collection-visibility.js';

export const exerciseKeysSchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
});
export type ExerciseKeys = z.infer<typeof exerciseKeysSchema>;

export const userDataSchema = z.object({
    id: z.string(),
    displayName: z.string(),
    username: z.string(),
});

export const userDataResponseSchema = z.object({
    user: userDataSchema.nullable().optional(),
    expired: z.boolean().optional(),
    userRegistrationsEnabled: z.boolean().optional(),
    userSelfServiceEnabled: z.boolean().optional(),
});

export type UserDataResponse = z.infer<typeof userDataResponseSchema>;

export interface AuthQueryParams {
    logoutStatus?: 'loggedOut' | 'noSessionFound' | 'sessionExpired';
    loginFailure?: string;
    loginSuccess?: boolean;
}

export const getExerciseResponseDataSchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
    createdAt: stringToDate,
    lastUsedAt: stringToDate,
    baseTemplate: z
        .object({ id: exerciseTemplateIdSchema, name: z.string() })
        .nullable(),
});
export type GetExerciseResponseData = z.infer<
    typeof getExerciseResponseDataSchema
>;

export const getExercisesResponseDataSchema = z.array(
    getExerciseResponseDataSchema
);
export type GetExercisesResponseData = z.infer<
    typeof getExercisesResponseDataSchema
>;
export type GetExercisesResponseDataInput = z.input<
    typeof getExercisesResponseDataSchema
>;

export const exerciseExistsResponseDataSchema = z.object({
    exists: z.boolean(),
    autojoin: z.boolean().optional(),
});

export type ExerciseExistsResponseDataInput = z.input<
    typeof exerciseExistsResponseDataSchema
>;

export const getExerciseTemplateResponseDataWithoutTrainerKeySchema = z.object({
    id: exerciseTemplateIdSchema,
    createdAt: stringToDate,
    lastUpdatedAt: stringToDate,
    lastExerciseCreatedAt: z.nullable(stringToDate),
    name: z.string(),
    description: z.string(),
});
export const getExerciseTemplateResponseDataSchema =
    getExerciseTemplateResponseDataWithoutTrainerKeySchema.extend({
        trainerKey: trainerKeySchema,
    });
export type GetExerciseTemplateResponseData = z.infer<
    typeof getExerciseTemplateResponseDataSchema
>;
export type GetExerciseTemplateResponseDataInput = z.input<
    typeof getExerciseTemplateResponseDataSchema
>;

export const postExerciseTemplateRequestDataSchema = z.object({
    name: z.string().trim().nonempty(),
    description: z.string().trim(),
});
export type PostExerciseTemplateRequestData = z.infer<
    typeof postExerciseTemplateRequestDataSchema
>;

export const patchExerciseTemplateRequestDataSchema =
    postExerciseTemplateRequestDataSchema.partial();
export type PatchExerciseTemplateRequestData = z.infer<
    typeof patchExerciseTemplateRequestDataSchema
>;

export const getExerciseTemplatesResponseDataSchema = z.array(
    getExerciseTemplateResponseDataSchema
);

export type GetExerciseTemplatesResponseData = z.infer<
    typeof getExerciseTemplatesResponseDataSchema
>;
export type GetExerciseTemplatesResponseDataInput = z.input<
    typeof getExerciseTemplatesResponseDataSchema
>;

export const joinExerciseResponseDataSchema = z.object({
    clientId: z.string(),
    exerciseTemplate: z.nullable(getExerciseTemplateResponseDataSchema),
    parallelExerciseId: parallelExerciseIdSchema.nullable(),
});
export type JoinExerciseResponseData = z.infer<
    typeof joinExerciseResponseDataSchema
>;
export type JoinExerciseResponseDataInput = z.input<
    typeof joinExerciseResponseDataSchema
>;

export const getParallelExerciseResponseDataSchema = z.object({
    id: parallelExerciseIdSchema,
    participantKey: groupParticipantKeySchema,
    createdAt: stringToDate,
    name: z.string(),
    joinViewportId: z.uuidv4(),
    template: getExerciseTemplateResponseDataWithoutTrainerKeySchema,
});
export type GetParallelExerciseResponseData = z.infer<
    typeof getParallelExerciseResponseDataSchema
>;
export const getParallelExercisesResponseDataSchema = z.array(
    getParallelExerciseResponseDataSchema
);
export type GetParallelExercisesResponseData = z.infer<
    typeof getParallelExercisesResponseDataSchema
>;

export const postParallelExerciseRequestDataSchema = z.object({
    joinViewportId: z.uuidv4(validationMessages.required),
    templateId: exerciseTemplateIdSchema,
    name: z.string().nonempty(validationMessages.required).trim(),
});
export type PostParallelExerciseRequestData = z.infer<
    typeof postParallelExerciseRequestDataSchema
>;

export const patchParallelExerciseRequestDataSchema =
    postParallelExerciseRequestDataSchema.pick({ name: true });
export type PatchParallelExerciseRequestData = z.infer<
    typeof patchParallelExerciseRequestDataSchema
>;

export const getExerciseTemplateViewportsResponseDataSchema = z.array(
    z.object({
        id: z.uuidv4(),
        name: z.string(),
    })
);
export type GetExerciseTemplateViewportsResponseData = z.infer<
    typeof getExerciseTemplateViewportsResponseDataSchema
>;

export const postJoinParallelExerciseResponseDataSchema = z.object({
    participantKey: participantKeySchema,
});

export const parallelExerciseInstanceSummarySchema = z.object({
    participantKey: participantKeySchema,
    trainerKey: trainerKeySchema,
    clientNames: z.array(z.string()),
    currentTime: z.number(),
    currentStatus: exerciseStatusSchema,
    lastLogEntry: z.optional(logEntrySchema),
    isActive: z.boolean(),
});
export type ParallelExerciseInstanceSummary = z.infer<
    typeof parallelExerciseInstanceSummarySchema
>;

export const parallelExerciseInstancesSchema = z.array(
    parallelExerciseInstanceSummarySchema
);

export const joinParallelExerciseResponseDataSchema = z.object({
    exerciseInstances: parallelExerciseInstancesSchema,
});
export type JoinParallelExerciseResponseData = z.infer<
    typeof joinParallelExerciseResponseDataSchema
>;

export const updateParallelExerciseInstancesSchema = z.object({
    exerciseInstances: parallelExerciseInstancesSchema,
});
export type UpdateParallelExerciseResponseData = z.infer<
    typeof updateParallelExerciseInstancesSchema
>;

class Route<TRequest = never, TResponse = never> {
    constructor(opts: { request?: TRequest; response?: TResponse }) {
        this.requestSchema = opts.request as TRequest;
        this.responseSchema = opts.response as TResponse;
    }

    public readonly requestSchema: TRequest;
    public readonly responseSchema: TResponse;
    public readonly Request!: TRequest extends z.ZodType
        ? z.infer<TRequest>
        : never;
    public readonly Response!: TResponse extends z.ZodType
        ? z.infer<TResponse>
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
                result: z.array(elementDtoSchema),
            }),
        });

        export const Import = new Route({
            request: z.object({
                objects: z.array(elementDtoSchema),
            }),
            response: z.object({
                newSetVersionId: collectionVersionIdSchema,
                result: z.array(elementDtoSchema),
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
                result: elementDtoSchema,
            }),
        });

        export const Restore = new Route({
            response: z.object({
                newCollectionVersionId: collectionVersionIdSchema,
                result: elementDtoSchema,
            }),
        });

        export const Duplicate = new Route({
            response: z.object({
                newSetVersionId: collectionVersionIdSchema,
                result: elementDtoSchema,
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
                requiresConfirmation: z.array(elementDtoSchema),
            }),
        });

        export const GetByEntityId = new Route({
            response: z.object({
                result: z.array(elementDtoSchema),
            }),
        });

        export const GetInternalDependencies = new Route({
            response: z.object({
                result: z.array(elementDtoSchema),
            }),
        });
    }

    export namespace Collection {
        export const inviteCodeDtoSchema = z.object({
            code: z.string(),
            expiresAt: stringToDate,
            collection: collectionEntityIdSchema,
        });

        export type InviteCodeDto = z.infer<typeof inviteCodeDtoSchema>;

        export const Create = new Route({
            request: z.object({
                title: z.string().trim().nonempty(),
            }),
            response: z.object({
                result: collectionDtoSchema,
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
                result: collectionDtoSchema,
            }),
        });

        export const GetCollectionMembers = new Route({
            response: z.object({
                result: z.array(
                    z.object({
                        id: z.string(),
                        displayName: z.string(),
                        role: collectionRelationshipTypeSchema,
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
                result: inviteCodeDtoSchema.nullable(),
            }),
        });

        export const PutInviteCode = new Route({
            response: z.object({
                result: inviteCodeDtoSchema,
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

        export type EditableCollectionProperties = z.infer<
            typeof editableCollectionPropertiesSchema
        >;

        export const Edit = new Route({
            request: editableCollectionPropertiesSchema,
            response: z.object({
                result: collectionDtoSchema,
            }),
        });

        export const LoadMy = new Route({
            response: z.object({
                result: z.array(extendedCollectionDtoSchema),
            }),
        });

        export const LoadPublic = new Route({
            response: z.object({
                result: z.array(extendedCollectionDtoSchema),
            }),
        });

        export const LoadUsable = new Route({
            response: z.object({
                result: z.array(extendedCollectionDtoSchema),
            }),
        });

        export const GetByEntityId = new Route({
            response: z.object({
                result: collectionDtoSchema,
            }),
        });

        export const GetLatestElementsBySetVersionId = new Route({
            response: collectionElementsDtoSchema,
        });

        export const GetCollectionVersion = new Route({
            response: z.object({
                result: collectionDtoSchema,
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
                importedSet: collectionElementsSingleSchema,
                newCollectionVersionId: collectionVersionIdSchema,
            }),
        });

        export const RemoveDependency = new Route({
            response: z.object({
                result: z.union([
                    z.object({
                        newCollectionVersionId:
                            collectionVersionIdSchema.nullable(),
                        blockingElements: z.array(elementDtoSchema),
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
            response: z.object({
                createdSet: collectionDtoSchema,
            }),
        });

        export const SaveDraftState = new Route({
            response: z.object({
                result: collectionDtoSchema.nullable(),
                saved: z.boolean().default(true),
            }),
        });

        export const DeleteDraftState = new Route({
            response: z.object({
                result: collectionDtoSchema.nullable(),
                reverted: z.boolean().default(true),
            }),
        });

        export const GetElementsOfCollectionVersion = new Route({
            response: collectionElementsDtoSchema,
        });

        class TypedSchema<D, T> {
            constructor(public readonly schema: T) {}

            public readonly Type!: T extends z.ZodType
                ? // if D is defined (override type), use D, otherwise infer from T
                  D extends unknown
                    ? z.infer<T>
                    : D
                : never;

            public readonly InputType!: T extends z.ZodType
                ? z.input<T>
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
                        data: z.infer<TData>;
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
                    collection: collectionDtoSchema,
                    elements: collectionElementsDtoSchema,
                    publishedCollection: collectionDtoSchema,
                    publishedElements: collectionElementsDtoSchema,
                    userRelationship: collectionRelationshipTypeSchema,
                })
            );

            export const ElementCreate = defineEvent(
                'element:create',
                elementDtoSchema
            );

            export const ElementUpdate = defineEvent(
                'element:update',
                elementDtoSchema
            );

            export const ElementDelete = defineEvent(
                'element:delete',
                z.object({
                    entityId: elementEntityIdSchema,
                })
            );

            export const CollectionUpdate = defineEvent(
                'collection:update',
                collectionDtoSchema
            );

            export const CollectionRefreshData = defineEvent(
                'collection:refresh-data',
                z.object({
                    draftElements: collectionElementsDtoSchema.optional(),
                    publishedElements: collectionElementsDtoSchema.optional(),
                    draftCollection: collectionDtoSchema.optional(),
                    publishedCollection: collectionDtoSchema.optional(),
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
