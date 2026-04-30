import { Immutable, WritableDraft } from 'immer';
import { z } from 'zod';
import { IsValue } from '../../utils/validators/is-value.js';
import type { Action, ActionReducer } from '../action-reducer.js';
import { IsZodSchema } from '../../utils/validators/is-zod-object.js';
import {
    elementDtoSchema,
    ElementDto,
} from '../../marketplace/models/versioned-elements.js';
import { cloneDeepMutable } from '../../utils/clone-deep.js';
import {
    type CollectionElementsDto,
    collectionElementsDtoSchema,
} from '../../marketplace/models/collection-elements.js';
import { CollectionElementType } from '../../marketplace/models/collection-element-type.js';
import { ExerciseState } from '../../state.js';
import { hasEntityProperties } from '../../marketplace/models/versioned-element-content.js';
import { getAllMarketplaceRegistryEntries } from '../../models/utils/marketplace-registry.js';
import {
    ChangeApply,
    changeApplySchema,
} from '../../marketplace/exercise-collection-upgrade/exercise-collection-change-apply.js';
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

    @IsZodSchema(collectionElementsDtoSchema)
    public readonly elements!: CollectionElementsDto;
}

export class UpgradeCollection implements Action {
    @IsValue('[Collection] Upgrade Collection' as const)
    public readonly type = '[Collection] Upgrade Collection';

    @IsZodSchema(versionedCollectionPartialSchema)
    public readonly collectionVersion!: VersionedCollectionPartial;

    @IsZodSchema(collectionElementsDtoSchema)
    public readonly overwriteTemplates!: CollectionElementsDto;

    @IsZodSchema(z.array(changeApplySchema))
    public readonly changeApplies!: ChangeApply[];
}

export class RemoveCollection implements Action {
    @IsValue('[Collection] Remove Collection' as const)
    public readonly type = '[Collection] Remove Collection';

    @IsZodSchema(collectionEntityIdSchema)
    public readonly collectionEntity!: CollectionEntityId;

    @IsZodSchema(elementDtoSchema.array())
    public readonly elements!: ElementDto[];
}

function addElement(
    draftState: WritableDraft<ExerciseState>,
    element: Immutable<ElementDto>,
    type: CollectionElementType,
    useVersionId: boolean = false
) {
    const mutableElement = cloneDeepMutable(element);

    const id = useVersionId ? element.versionId : element.content.id;
    draftState.templates[id] = {
        ...mutableElement.content,
        id: useVersionId ? element.versionId : element.content.id,
        entity: {
            entityId: element.entityId,
            versionId: element.versionId,
            type,
        },
    };
}

function addCollectionElements(
    draftState: WritableDraft<ExerciseState>,
    elements: Immutable<CollectionElementsDto>
) {
    for (const directElement of elements.direct) {
        addElement(draftState, directElement, 'direct', true);
    }
    for (const elementType of ['imported', 'references'] as const) {
        for (const collectionElements of elements[elementType]) {
            for (const element of collectionElements.elements) {
                addElement(draftState, element, elementType, true);
            }
        }
    }
}

export namespace CollectionReducers {
    export const addCollection: ActionReducer<AddCollection> = {
        action: AddCollection,
        reducer: (draftState, data) => {
            addCollectionElements(draftState, data.elements);
            draftState.selectedCollections.push(data.collectionVersion);
            return draftState;
        },
        rights: 'trainer',
    };
    export const upgradeCollection: ActionReducer<UpgradeCollection> = {
        action: UpgradeCollection,
        reducer: (draftState, data) => {
            // Remove old templates
            draftState.templates = Object.fromEntries(
                Object.entries(draftState.templates).filter(
                    ([_, element]) => !hasEntityProperties(element)
                )
            );

            // Add new templates from the collections to state
            addCollectionElements(draftState, data.overwriteTemplates);

            for (const changeApply of data.changeApplies) {
                const marketplaceEntries = getAllMarketplaceRegistryEntries();
                for (const entry of Object.values(marketplaceEntries)) {
                    entry.changeApply(draftState, changeApply);
                }
            }

            draftState.selectedCollections = draftState.selectedCollections.map(
                (collection) => {
                    if (
                        collection.entityId === data.collectionVersion.entityId
                    ) {
                        return data.collectionVersion;
                    }
                    return collection;
                }
            );

            return draftState;
        },
        rights: 'trainer',
    };
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
