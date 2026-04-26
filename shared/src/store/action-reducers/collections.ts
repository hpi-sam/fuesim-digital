import { Immutable } from 'immer';
import { z } from 'zod';
import { IsValue } from '../../utils/validators/is-value.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    elementDtoSchema,
    ElementDto,
} from '../../marketplace/models/versioned-elements.js';

import { cloneDeepMutable } from '../../utils/clone-deep.js';
import { changeApplySchema, ChangeApply } from '../../marketplace/collection-upgrade-impact.js';
import {
    collectionEntityIdSchema,
    versionedCollectionPartialSchema,
    type VersionedCollectionPartial,
    type CollectionEntityId,
} from './../../marketplace/models/versioned-id-schema.js';

export class AddCollection implements Action {
    @IsValue('[Collection] Add Collection' as const)
    public readonly type = '[Collection] Add Collection';

    @IsZodSchema(versionedCollectionPartialSchema)
    public readonly collectionVersion!: VersionedCollectionPartial;

    @IsZodSchema(elementDtoSchema.array())
    public readonly elements!: ElementDto[];
}


export class UpgradeCollection implements Action {
    @IsValue('[Collection] Upgrade Collection' as const)
    public readonly type = '[Collection] Upgrade Collection';

    @IsZodSchema(versionedCollectionPartialSchema)
    public readonly collectionVersion!: VersionedCollectionPartial;

    @IsZodSchema(elementDtoSchema.array())
    public readonly elements!: ElementDto[];

    @IsZodSchema(z.array(changeApplySchema))
    public readonly changesToApply!: ChangeApply[];
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
                element: Immutable<ElementDto>,
                useVersionId: boolean = false
            ) => {
                const mutableElement = cloneDeepMutable(element);
                const existingElement = draftState.templates[element.entityId];
                const usedBy: CollectionEntityId[] | undefined =
                    // @ts-expect-error: Not all templates have usedBy :)
                    existingElement?.usedBy;

                draftState.templates[element.versionId] = {
                    ...mutableElement.content,
                    id: useVersionId ? element.versionId : element.content.id,
                    entityId: element.entityId,
                    versionId: element.versionId,
                    usedBy: [
                        ...(usedBy ?? []),
                        data.collectionVersion.entityId,
                    ],
                };
            };

            for (const element of data.elements) {
                switch (element.content.type) {
                    case 'vehicleTemplate':
                        addElement(element, true);
                        break;
                    case 'alarmGroup':
                        addElement(element, true);
                        break;
                }
            }

            draftState.selectedCollections.push(data.collectionVersion);
            return draftState;
        },
        rights: 'trainer',
    };
    export const upgradeCollection: ActionReducer<UpgradeCollection> = {
        action: UpgradeCollection,
        reducer: (draftState, data) => {
            const collection = draftState.selectedCollections.find(
                (cf) =>
                    cf.entityId ===
                    data.collectionVersion.entityId
            );
            if (!collection) {
                console.warn(
                    `Collection with entityId ${data.collectionVersion.entityId} not found in selectedCollections. Cannot upgrade collection.`
                );
                return draftState;
            }
            collection.versionId = data.collectionVersion.versionId;

            draftState.templates = Object.fromEntries(
                Object.entries(draftState.templates).map(([key, element]) => {

                    /*const changeToApply = data.changesToApply.find(f=>f.change.entity.versionId === element.versionId);
                    if (!changeToApply) {
                        return [key, element];
                    }*/


                    return [key, element];
                })
            )

// TODO: !!!! @Quixelation




            return draftState;
        },
        rights: 'trainer',
    }
    export const removeCollection: ActionReducer<RemoveCollection> = {
        action: RemoveCollection,
        reducer: (draftState, data) => {
            draftState.templates = Object.fromEntries(
                Object.entries(draftState.templates)
                    .filter(([_, element]) => {
                        const usedBy: CollectionEntityId[] =
                            // @ts-expect-error: Not every template has usedBy :)
                            element.usedBy ?? [];

                        if (
                            usedBy.length === 1 &&
                            usedBy[0] === data.collectionEntity
                        ) {
                            return false;
                        }
                        return true;
                    })
                    .map(([key, element]) => {
                        const usedBy: CollectionEntityId[] =
                            // @ts-expect-error: Not every template has usedBy :)
                            element.usedBy ?? [];
                        return [
                            key,
                            {
                                ...element,
                                usedBy: usedBy.filter(
                                    (entityId) =>
                                        entityId !== data.collectionEntity
                                ),
                            },
                        ];
                    })
            );

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
