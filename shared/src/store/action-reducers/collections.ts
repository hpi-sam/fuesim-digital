import { IsValue } from '../../utils/validators/index.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    type VersionedCollectionPartial,
    versionedCollectionPartialSchema,
    type CollectionEntityId,
    collectionEntityIdSchema,
    elementDtoSchema,
    ElementDto,
    VersionedElementContent,
} from '../../index.js';

export class AddCollection implements Action {
    @IsValue('[Collection] Add Collection' as const)
    public readonly type = '[Collection] Add Collection';

    @IsZodSchema(versionedCollectionPartialSchema)
    public readonly collectionVersion!: VersionedCollectionPartial;

    @IsZodSchema(elementDtoSchema.array())
    public readonly elements!: ElementDto[];
}

export class RemoveCollection implements Action {
    @IsValue('[Collection] Remove Collection' as const)
    public readonly type = '[Collection] Remove Collection';

    @IsZodSchema(collectionEntityIdSchema)
    public readonly collectionEntity!: CollectionEntityId;

    @IsZodSchema(elementDtoSchema.array())
    public readonly elements!: ElementDto[];
}

export namespace CollectionReducers {
    export const addCollection: ActionReducer<AddCollection> = {
        action: AddCollection,
        reducer: (draftState, data) => {
            const addElement = (
                obj: { [id: string]: any },
                element: ElementDto
            ) => {
                obj[element.entityId] = {
                    ...element.content,
                    entityId: element.entityId,
                    versionId: element.versionId,
                    usedBy: [
                        ...(obj[element.entityId]?.usedBy ?? []),
                        data.collectionVersion.entityId,
                    ],
                };
            };

            for (const element of data.elements) {
                switch (element.content.type) {
                    case 'vehicleTemplate':
                        addElement(draftState.vehicleTemplates, element);
                        break;
                    case 'alarmGroup':
                        addElement(draftState.alarmGroups, element);
                        break;
                }
            }

            draftState.selectedCollections.push(data.collectionVersion);
            return draftState;
        },
        rights: 'trainer',
    };
    export const removeCollection: ActionReducer<RemoveCollection> = {
        action: RemoveCollection,
        reducer: (draftState, data) => {
            const stripLonelyElements = (obj: {
                [id: string]: VersionedElementContent;
            }) => {
                for (const [key, element] of Object.entries(obj)) {
                    if (
                        element.usedBy?.length === 1 &&
                        element.usedBy[0] === data.collectionEntity
                    ) {
                        delete obj[key];
                    } else {
                        element.usedBy = element.usedBy?.filter(
                            (entityId) => entityId !== data.collectionEntity
                        );
                    }
                }
            };

            stripLonelyElements(draftState.vehicleTemplates);
            stripLonelyElements(draftState.alarmGroups);

            draftState.selectedCollections =
                draftState.selectedCollections.filter(
                    (collection) =>
                        collection.entityId !== data.collectionEntity
                );
            return draftState;
        },
        rights: 'trainer',
    };
}
